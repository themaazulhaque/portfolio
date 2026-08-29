import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const wsPath = process.env.WS_PATH || "/ws";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

type WsClient = {
  socket: WebSocket;
  isAlive: boolean;
};

const clients = new Set<WsClient>();

function broadcast(data: object, exclude?: WebSocket): void {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.socket === exclude) continue;
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(message);
    }
  }
}

function broadcastToAdmins(data: object): void {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if ((client.socket as unknown as { isAdmin?: boolean }).isAdmin && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(message);
    }
  }
}

// Expose broadcast functions for use by API routes via globalThis
declare global {
  var __wsBroadcast: typeof broadcast | undefined;
  var __wsBroadcastToAdmins: typeof broadcastToAdmins | undefined;
}
globalThis.__wsBroadcast = broadcast;
globalThis.__wsBroadcastToAdmins = broadcastToAdmins;

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url || "", true);
    if (pathname !== wsPath) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    const client: WsClient = { socket: ws, isAlive: true };
    clients.add(client);

    console.log(`[WS] Client connected (${clients.size} total)`);

    ws.send(JSON.stringify({
      type: "system:connected",
      payload: { timestamp: new Date().toISOString() },
    }));

    ws.on("pong", () => {
      client.isAlive = true;
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as Record<string, unknown>;
        if (msg.type === "auth:admin") {
          (ws as unknown as Record<string, unknown>).isAdmin = true;
          ws.send(JSON.stringify({
            type: "auth:success",
            payload: { timestamp: new Date().toISOString() },
          }));
        }
      } catch {
        // ignore invalid messages
      }
    });

    ws.on("close", () => {
      clients.delete(client);
      console.log(`[WS] Client disconnected (${clients.size} total)`);
    });

    ws.on("error", () => {
      clients.delete(client);
    });
  });

  const interval = setInterval(() => {
    for (const client of clients) {
      if (!client.isAlive) {
        client.socket.terminate();
        clients.delete(client);
        continue;
      }
      client.isAlive = false;
      client.socket.ping();
    }
  }, 30_000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server on ws://${hostname}:${port}${wsPath}`);
  });
});

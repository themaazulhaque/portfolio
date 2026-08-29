import type {
  ConnectionStatus,
  WebSocketConfig,
  WebSocketMessage,
  MessageHandler,
} from "./types";

const DEFAULT_CONFIG: Required<Omit<WebSocketConfig, "url">> & { url: string } = {
  url: "",
  reconnect: true,
  maxReconnectAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
};

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private config: typeof DEFAULT_CONFIG;
  private status: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<MessageHandler>();
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private isManualClose = false;

  constructor(config: WebSocketConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  connect(): void {
    if (
      this.status === "connected" ||
      this.status === "connecting"
    ) {
      return;
    }

    if (!this.config.url) {
      this.setStatus("disconnected");
      return;
    }

    this.isManualClose = false;
    this.setStatus("connecting");

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.setStatus("connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        if (!this.isManualClose) {
          this.setStatus("disconnected");
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.setStatus("error");
      };
    } catch {
      this.setStatus("error");
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.isManualClose = true;
    this.clearReconnectTimer();
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setStatus("disconnected");
  }

  send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(handler: MessageHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(handler);
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private handleMessage(raw: string): void {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!this.isValidMessage(parsed)) return;
      this.listeners.forEach((handler) => handler(parsed));
    } catch {
      // Invalid JSON — ignore
    }
  }

  private isValidMessage(data: unknown): data is WebSocketMessage {
    if (typeof data !== "object" || data === null) return false;
    const obj = data as Record<string, unknown>;
    if (typeof obj.type !== "string") return false;
    if (!obj.payload || typeof obj.payload !== "object") return false;
    const validTypes = [
      "review:new",
      "review:approved",
      "review:rejected",
      "admin:update",
      "system:connected",
      "system:ping",
      "system:info",
      "auth:success",
    ];
    return validTypes.includes(obj.type);
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach((handler) => handler(status));
  }

  private scheduleReconnect(): void {
    if (
      !this.config.reconnect ||
      this.reconnectAttempts >= this.config.maxReconnectAttempts
    ) {
      return;
    }

    this.setStatus("reconnecting");

    const delay = Math.min(
      this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      this.config.reconnectMaxDelay
    );
    const jitter = delay * 0.1 * Math.random();
    const totalDelay = delay + jitter;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, totalDelay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

let singleton: RealtimeClient | null = null;

export function getRealtimeClient(): RealtimeClient {
  if (!singleton) {
    const url = process.env.NEXT_PUBLIC_WS_URL || "";
    singleton = new RealtimeClient({ url });
  }
  return singleton;
}

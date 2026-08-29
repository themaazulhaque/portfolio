"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRealtimeClient } from "./websocket";
import type { ConnectionStatus, MessageHandler, WebSocketMessage } from "./types";

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  send: (data: unknown) => void;
  subscribe: (handler: MessageHandler) => () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const clientRef = useRef(getRealtimeClient());
  const [status, setStatus] = useState<ConnectionStatus>(
    clientRef.current.getStatus()
  );

  useEffect(() => {
    const client = clientRef.current;
    const unsub = client.onStatusChange(setStatus);
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      const client = clientRef.current;
      if (client.getStatus() === "disconnected") {
        client.connect();
      }
    };

    const handleOffline = () => {
      // Do not reconnect while offline
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        clientRef.current.getStatus() === "disconnected"
      ) {
        clientRef.current.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const connect = useCallback(() => {
    clientRef.current.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current.disconnect();
  }, []);

  const send = useCallback((data: unknown) => {
    clientRef.current.send(data);
  }, []);

  const subscribe = useCallback((handler: MessageHandler) => {
    return clientRef.current.subscribe(handler);
  }, []);

  return { status, connect, disconnect, send, subscribe };
}

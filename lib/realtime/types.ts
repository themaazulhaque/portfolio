export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

export type WebSocketMessage =
  | ReviewNotification
  | AdminNotification
  | SystemNotification
  | AuthNotification;

export interface ReviewNotification {
  type: "review:new" | "review:approved" | "review:rejected";
  payload: {
    id: string;
    name: string;
    status: "pending" | "approved" | "rejected";
    timestamp: string;
  };
}

export interface AdminNotification {
  type: "admin:update";
  payload: {
    message: string;
    timestamp: string;
  };
}

export interface SystemNotification {
  type: "system:connected" | "system:ping" | "system:info";
  payload: {
    message?: string;
    timestamp: string;
  };
}

export interface AuthNotification {
  type: "auth:success";
  payload: {
    timestamp: string;
  };
}

export interface WebSocketConfig {
  url: string;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectBaseDelay?: number;
  reconnectMaxDelay?: number;
}

export type MessageHandler = (message: WebSocketMessage) => void;

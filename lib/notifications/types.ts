export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export type PushPermissionState = "unsupported" | "denied" | "granted" | "default";

export interface PushNotificationConfig {
  vapidPublicKey: string;
  serviceWorkerRegistration?: ServiceWorkerRegistration;
}

export interface PushManager {
  isSupported(): boolean;
  getPermissionState(): PushPermissionState;
  requestPermission(): Promise<PushPermissionState>;
  subscribe(): Promise<PushSubscriptionData | null>;
  unsubscribe(): Promise<boolean>;
  getSubscription(): Promise<PushSubscriptionData | null>;
}

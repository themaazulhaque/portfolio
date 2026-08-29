import type {
  PushManager,
  PushNotificationConfig,
  PushPermissionState,
  PushSubscriptionData,
} from "./types";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function createPushManager(config: PushNotificationConfig): PushManager {
  let registration: ServiceWorkerRegistration | null = null;

  function isSupported(): boolean {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  function getPermissionState(): PushPermissionState {
    if (!isSupported()) return "unsupported";
    return Notification.permission as PushPermissionState;
  }

  async function ensureRegistration(): Promise<ServiceWorkerRegistration> {
    if (registration) return registration;
    if (config.serviceWorkerRegistration) {
      registration = config.serviceWorkerRegistration;
      return registration;
    }
    registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return registration;
  }

  async function requestPermission(): Promise<PushPermissionState> {
    if (!isSupported()) return "unsupported";
    const result = await Notification.requestPermission();
    return result as PushPermissionState;
  }

  async function subscribe(): Promise<PushSubscriptionData | null> {
    if (!isSupported()) return null;

    const permission = await requestPermission();
    if (permission !== "granted") return null;

    const reg = await ensureRegistration();

    const existingSubscription = await reg.pushManager.getSubscription();
    if (existingSubscription) {
      return extractSubscriptionData(existingSubscription);
    }

    const applicationServerKey = urlBase64ToUint8Array(config.vapidPublicKey);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    return extractSubscriptionData(subscription);
  }

  async function unsubscribe(): Promise<boolean> {
    if (!isSupported()) return false;

    try {
      const reg = await ensureRegistration();
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        return await subscription.unsubscribe();
      }
      return true;
    } catch {
      return false;
    }
  }

  async function getSubscription(): Promise<PushSubscriptionData | null> {
    if (!isSupported()) return null;

    try {
      const reg = await ensureRegistration();
      const subscription = await reg.pushManager.getSubscription();
      if (!subscription) return null;
      return extractSubscriptionData(subscription);
    } catch {
      return null;
    }
  }

  function extractSubscriptionData(
    subscription: PushSubscription
  ): PushSubscriptionData {
    const keys = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: keys ? btoa(String.fromCharCode(...new Uint8Array(keys))) : "",
        auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : "",
      },
    };
  }

  return {
    isSupported,
    getPermissionState,
    requestPermission,
    subscribe,
    unsubscribe,
    getSubscription,
  };
}

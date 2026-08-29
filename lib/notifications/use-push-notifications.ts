"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPushManager } from "./push";
import { registerPushSubscription, unregisterPushSubscription } from "./client";
import type { PushManager, PushPermissionState, PushSubscriptionData } from "./types";

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: PushPermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const managerRef = useRef<PushManager | null>(null);
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    if (!vapidKey) {
      setIsSupported(false);
      return;
    }

    const manager = createPushManager({ vapidPublicKey: vapidKey });
    managerRef.current = manager;

    const supported = manager.isSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(manager.getPermissionState());
      manager.getSubscription().then((sub) => {
        setIsSubscribed(sub !== null);
      });
    }
  }, []);

  const enable = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager) return;

    setIsLoading(true);
    setError(null);

    try {
      const subscription = await manager.subscribe();
      if (!subscription) {
        const perm = manager.getPermissionState();
        setPermission(perm);
        if (perm === "denied") {
          setError("Notifications blocked by browser");
        }
        setIsLoading(false);
        return;
      }

      setPermission("granted");
      setIsSubscribed(true);

      const result = await registerPushSubscription(subscription);
      if (!result.success && result.error !== "Backend not configured") {
        setError(result.error || "Failed to register");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager) return;

    setIsLoading(true);
    setError(null);

    try {
      const subscription = await manager.getSubscription();
      if (subscription) {
        await unregisterPushSubscription(subscription.endpoint);
      }
      await manager.unsubscribe();
      setIsSubscribed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    enable,
    disable,
  };
}

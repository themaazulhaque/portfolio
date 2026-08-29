import type { PushSubscriptionData } from "./types";

const SUBSCRIBE_ENDPOINT = "/api/notifications/subscribe";
const UNSUBSCRIBE_ENDPOINT = "/api/notifications/unsubscribe";

export async function registerPushSubscription(
  subscription: PushSubscriptionData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(SUBSCRIBE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Backend not configured" };
      }
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function unregisterPushSubscription(
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(UNSUBSCRIBE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Backend not configured" };
      }
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

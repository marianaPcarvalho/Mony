import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppData } from "./types";

const TOKEN_KEY = "budget-app-device-token";
const SUBSCRIBER_KEY = "budget-app-subscriber";

export interface SubscriberInfo {
  email: string;
  enabled: boolean;
}

export function getDeviceToken(): string {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function getLocalSubscriber(): SubscriberInfo | null {
  try {
    const raw = localStorage.getItem(SUBSCRIBER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalSubscriber(info: SubscriberInfo | null) {
  if (info) localStorage.setItem(SUBSCRIBER_KEY, JSON.stringify(info));
  else localStorage.removeItem(SUBSCRIBER_KEY);
}

/** Push a snapshot via edge function (service role required). */
export async function pushSnapshot(data: AppData) {
  const deviceToken = getDeviceToken();
  await supabase.functions.invoke("sync-snapshot", {
    body: { deviceToken, data },
  });
}

/** Update subscription. Pass `email: ""` to unsubscribe. */
export async function updateSubscription(opts: { email?: string; enabled?: boolean }) {
  const deviceToken = getDeviceToken();
  return await supabase.functions.invoke("sync-snapshot", {
    body: { deviceToken, ...opts },
  });
}

/** Send a preview recap email immediately. */
export async function sendRecapPreview() {
  const deviceToken = getDeviceToken();
  const res = await fetch("/api/send-recap-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceToken }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    return { error: errorBody?.error ?? `Request failed with status ${res.status}` };
  }

  return res.json();
}

/** React hook: debounced cloud sync of `data`. Only syncs if user has subscribed. */
export function useCloudSync(data: AppData) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Only sync if user has set up a subscription (otherwise we don't need cloud copy)
    if (!getLocalSubscriber()) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pushSnapshot(data).catch(() => {/* silent */});
    }, 2000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data]);
}

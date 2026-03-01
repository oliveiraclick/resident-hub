import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION, NATIVE_APP_VERSION } from "@/lib/appVersion";

function getDevicePlatform(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Desconhecido";
}

function getAppVersion(): string {
  const params = new URLSearchParams(window.location.search);
  const isNative = params.get("native") === "1" || /\b(capacitor|wv)\b/i.test(navigator.userAgent);
  if (isNative) {
    return `App ${NATIVE_APP_VERSION} · Base ${APP_VERSION}`;
  }
  return `Web · Base ${APP_VERSION}`;
}

/**
 * Saves device platform and app version to the user's profile.
 * Runs once per session.
 */
export function useDeviceInfo(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const platform = getDevicePlatform();
    const version = getAppVersion();

    supabase
      .from("profiles")
      .update({
        device_platform: platform,
        app_version: version,
        device_updated_at: new Date().toISOString(),
      } as any)
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) console.warn("Device info update failed:", error.message);
      });
  }, [userId]);
}

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/nativeDetect";

/**
 * Registers the device for push notifications using Capacitor.
 * Saves the FCM token to the device_tokens table.
 * Only runs inside the native app (Capacitor).
 */
export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    if (!isNativeApp) {
      console.log("[Push] Not native environment, skipping");
      return;
    }

    // Also check Capacitor bridge availability
    const isNativePlatform = Capacitor.isNativePlatform();
    console.log("[Push] isNativeApp:", isNativeApp, "Capacitor.isNativePlatform:", isNativePlatform);

    if (!isNativePlatform) {
      console.log("[Push] Capacitor bridge not available, skipping");
      savePushDebug(userId, "bridge_unavailable", "Capacitor.isNativePlatform() = false");
      return;
    }

    let cleanup: (() => void) | undefined;

    const init = async () => {
      try {
        console.log("[Push] Importing PushNotifications plugin...");
        const { PushNotifications } = await import("@capacitor/push-notifications");
        console.log("[Push] Plugin imported successfully");

        let hasRegistrationResult = false;
        let registerTimeout: ReturnType<typeof setTimeout> | undefined;
        const clearRegisterTimeout = () => {
          if (registerTimeout) {
            clearTimeout(registerTimeout);
            registerTimeout = undefined;
          }
        };

        // Register listeners BEFORE calling register() to avoid missing fast iOS token events
        const tokenListener = await PushNotifications.addListener(
          "registration",
          async (token) => {
            hasRegistrationResult = true;
            clearRegisterTimeout();
            console.log("[Push] ✅ Token received:", token.value.substring(0, 20) + "...");
            const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";

            console.log("[Push] Saving token to DB for platform:", platform);
            const { error } = await supabase
              .from("device_tokens")
              .upsert(
                {
                  user_id: userId,
                  token: token.value,
                  platform,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,token" }
              );

            if (error) {
              console.error("[Push] ❌ Failed to save token:", error.message, error.details);
              savePushDebug(userId, "save_error", error.message);
            } else {
              console.log("[Push] ✅ Token saved successfully");
              savePushDebug(userId, "token_saved", `${platform}:${token.value.substring(0, 15)}...`);
            }
          }
        );

        const errorListener = await PushNotifications.addListener(
          "registrationError",
          (err) => {
            hasRegistrationResult = true;
            clearRegisterTimeout();
            console.error("[Push] ❌ Registration error:", JSON.stringify(err));
            savePushDebug(userId, "registration_error", JSON.stringify(err).substring(0, 200));
          }
        );

        // Handle received notifications (foreground)
        const receivedListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("[Push] Notification received in foreground:", notification.title);
          }
        );

        // Handle notification tap
        const actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            console.log("[Push] Notification tapped:", action.notification?.title);
          }
        );

        // Check current permission status first
        const permStatus = await PushNotifications.checkPermissions();
        console.log("[Push] Current permission status:", permStatus.receive);

        // Request permission only when needed
        let permission = permStatus.receive;
        if (permission === "prompt") {
          console.log("[Push] Requesting permissions...");
          const permResult = await PushNotifications.requestPermissions();
          permission = permResult.receive;
          console.log("[Push] Permission result:", permission);
        }

        if (permission !== "granted") {
          console.warn("[Push] Permission NOT granted:", permission);
          savePushDebug(userId, "permission_denied", permission);
          cleanup = () => {
            clearRegisterTimeout();
            tokenListener.remove();
            errorListener.remove();
            receivedListener.remove();
            actionListener.remove();
          };
          return;
        }

        // Register with APNs / FCM
        console.log("[Push] Calling register()...");
        await PushNotifications.register();
        console.log("[Push] register() completed, waiting for token...");
        savePushDebug(userId, "register_called", "waiting for token event");

        registerTimeout = setTimeout(() => {
          if (!hasRegistrationResult) {
            savePushDebug(userId, "no_token_after_register", "No registration callback after 12s");
          }
        }, 12000);

        cleanup = () => {
          clearRegisterTimeout();
          tokenListener.remove();
          errorListener.remove();
          receivedListener.remove();
          actionListener.remove();
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[Push] ❌ Init failed:", msg);
        savePushDebug(userId, "init_error", msg.substring(0, 200));
      }
    };

    init();

    return () => cleanup?.();
  }, [userId]);
}

/** Save push debug info to profile so we can query remotely */
async function savePushDebug(userId: string, status: string, detail: string) {
  try {
    const platform = Capacitor.getPlatform();
    const debugInfo = `[${new Date().toISOString()}] ${platform} | ${status}: ${detail}`;
    await supabase
      .from("profiles")
      .update({ app_version: debugInfo })
      .eq("user_id", userId);
  } catch (_) {
    // silent
  }
}

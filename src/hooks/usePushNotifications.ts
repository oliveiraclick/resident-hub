import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registers the device for push notifications using Capacitor.
 * Saves the FCM token to the device_tokens table.
 * Only runs inside the native app (Capacitor).
 */
export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) {
      console.log("[Push] No userId, skipping");
      return;
    }

    const isCapNative = Capacitor.isNativePlatform();
    const hasNativeParam = new URLSearchParams(window.location.search).get("native") === "1";
    const hasWvUA = /\b(capacitor|wv)\b/i.test(navigator.userAgent);
    const isNative = isCapNative || hasNativeParam || hasWvUA;

    console.log("[Push] Detection:", {
      isCapNative,
      hasNativeParam,
      hasWvUA,
      isNative,
      platform: Capacitor.getPlatform(),
      userAgent: navigator.userAgent.substring(0, 120),
    });

    if (!isNative) {
      console.log("[Push] Not native environment, skipping");
      return;
    }

    let cleanup: (() => void) | undefined;

    const init = async () => {
      try {
        console.log("[Push] Importing PushNotifications plugin...");
        const { PushNotifications } = await import("@capacitor/push-notifications");
        console.log("[Push] Plugin imported successfully");

        // Request permission
        console.log("[Push] Requesting permissions...");
        const permResult = await PushNotifications.requestPermissions();
        console.log("[Push] Permission result:", permResult.receive);

        if (permResult.receive !== "granted") {
          console.warn("[Push] Permission NOT granted:", permResult.receive);
          return;
        }

        // Register with APNs / FCM
        console.log("[Push] Calling register()...");
        await PushNotifications.register();
        console.log("[Push] register() completed, waiting for token...");

        // Listen for the registration token
        const tokenListener = await PushNotifications.addListener(
          "registration",
          async (token) => {
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
            } else {
              console.log("[Push] ✅ Token saved successfully");
            }
          }
        );

        const errorListener = await PushNotifications.addListener(
          "registrationError",
          (err) => {
            console.error("[Push] ❌ Registration error:", JSON.stringify(err));
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

        cleanup = () => {
          tokenListener.remove();
          errorListener.remove();
          receivedListener.remove();
          actionListener.remove();
        };
      } catch (e) {
        console.error("[Push] ❌ Init failed:", e instanceof Error ? e.message : e);
      }
    };

    init();

    return () => cleanup?.();
  }, [userId]);
}

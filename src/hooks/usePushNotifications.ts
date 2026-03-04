import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registers the device for push notifications using Capacitor.
 * Saves the FCM token to the device_tokens table.
 * Only runs inside the native app (Capacitor).
 */
export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const isNative =
      new URLSearchParams(window.location.search).get("native") === "1" ||
      /\b(capacitor|wv)\b/i.test(navigator.userAgent);

    if (!isNative) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") {
          console.warn("Push permission not granted");
          return;
        }

        // Register with APNs / FCM
        await PushNotifications.register();

        // Listen for the registration token
        const tokenListener = await PushNotifications.addListener(
          "registration",
          async (token) => {
            console.log("Push token:", token.value);
            const platform = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "ios" : "android";

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

            if (error) console.error("Failed to save push token:", error.message);
          }
        );

        const errorListener = await PushNotifications.addListener(
          "registrationError",
          (err) => {
            console.error("Push registration error:", err);
          }
        );

        // Handle received notifications (foreground)
        const receivedListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("Push received:", notification);
          }
        );

        // Handle notification tap
        const actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            console.log("Push action:", action);
          }
        );

        cleanup = () => {
          tokenListener.remove();
          errorListener.remove();
          receivedListener.remove();
          actionListener.remove();
        };
      } catch (e) {
        console.warn("Push notifications not available:", e);
      }
    };

    init();

    return () => cleanup?.();
  }, [userId]);
}

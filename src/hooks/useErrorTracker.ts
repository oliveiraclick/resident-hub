import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useErrorTracker = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      supabase
        .from("error_logs" as any)
        .insert({
          message: event.message || "Unknown error",
          stack: event.error?.stack?.substring(0, 2000) || null,
          url: event.filename || window.location.href,
          context: { line: event.lineno, col: event.colno },
        })
        .then(() => {});
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg =
        event.reason?.message || String(event.reason) || "Unhandled rejection";
      supabase
        .from("error_logs" as any)
        .insert({
          message: msg.substring(0, 500),
          stack: event.reason?.stack?.substring(0, 2000) || null,
          url: window.location.href,
          context: { type: "unhandled_rejection" },
        })
        .then(() => {});
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
};

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useActivityLog = () => {
  const { user } = useAuth();

  const logActivity = useCallback(
    async (
      action: string,
      entityType?: string,
      entityId?: string,
      details?: Record<string, unknown>
    ) => {
      if (!user) return;
      try {
        await supabase.from("activity_logs" as any).insert({
          user_id: user.id,
          action,
          entity_type: entityType || null,
          entity_id: entityId || null,
          details: details || {},
        });
      } catch (_) {
        /* silent */
      }
    },
    [user]
  );

  return { logActivity };
};

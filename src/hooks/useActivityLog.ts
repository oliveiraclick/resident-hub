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
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details: (details as any) || null,
        });
      } catch (_) {
        /* silent */
      }
    },
    [user]
  );

  return { logActivity };
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAppTheme = () => {
  const [isWorldCupTheme, setIsWorldCupTheme] = useState(false);

  useEffect(() => {
    const checkTheme = async () => {
      // Use raw from string to avoid TS generation issues with new table
      const { data, error } = await supabase
        .from("app_configs" as any)
        .select("*")
        .eq("key", "theme_world_cup")
        .maybeSingle();

      if (error || !data) return;

      const now = new Date();
      const isEnabled = (data as any).enabled;
      const startAt = (data as any).start_at ? new Date((data as any).start_at) : null;
      const endAt = (data as any).end_at ? new Date((data as any).end_at) : null;

      let active = false;

      if (isEnabled) {
        if (!startAt && !endAt) {
          active = true;
        } else if (startAt && !endAt) {
          active = now >= startAt;
        } else if (!startAt && endAt) {
          active = now <= endAt;
        } else if (startAt && endAt) {
          active = now >= startAt && now <= endAt;
        }
      }

      setIsWorldCupTheme(active);
      
      if (active) {
        document.body.classList.add("theme-brasil");
      } else {
        document.body.classList.remove("theme-brasil");
      }
    };

    checkTheme();
    const interval = setInterval(checkTheme, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return { isWorldCupTheme };
};

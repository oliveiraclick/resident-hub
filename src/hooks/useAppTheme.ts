import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAppTheme = () => {
  const [isWorldCupTheme, setIsWorldCupTheme] = useState(false);

  useEffect(() => {
    const checkTheme = async () => {
      const { data, error } = await supabase
        .from("app_configs")
        .select("*")
        .eq("key", "theme_world_cup")
        .single();

      if (error || !data) return;

      const now = new Date();
      const isEnabled = data.enabled;
      const startAt = data.start_at ? new Date(data.start_at) : null;
      const endAt = data.end_at ? new Date(data.end_at) : null;

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

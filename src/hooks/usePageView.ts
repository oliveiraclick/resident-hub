import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const getModule = (path: string): string => {
  if (path.startsWith("/master")) return "master";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/morador")) return "morador";
  if (path.startsWith("/prestador")) return "prestador";
  if (path.startsWith("/porteiro")) return "porteiro";
  return "public";
};

export const usePageView = () => {
  const { user } = useAuth();
  const location = useLocation();
  const lastPath = useRef("");

  useEffect(() => {
    const path = location.pathname;
    if (!user || path === lastPath.current) return;
    lastPath.current = path;

    supabase
      .from("page_views" as any)
      .insert({
        user_id: user.id,
        page: path,
        module: getModule(path),
      })
      .then(() => {});
  }, [location.pathname, user]);
};

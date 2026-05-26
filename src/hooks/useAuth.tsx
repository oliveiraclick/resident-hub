import { useState, useEffect, useRef, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "morador" | "prestador" | "admin" | "platform_admin";

interface UserRole {
  condominio_id: string | null;
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: UserRole[];
  rolesLoading: boolean;
  signOut: () => Promise<void>;
  hasRole: (condominioId: string, role: AppRole) => boolean;
  isPlatformAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  // Derived loading: true until we've fetched roles for the CURRENT user.
  const rolesLoading = !!user && loadedUserId !== user.id;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[Auth] event:", event, "user:", session?.user?.id ?? "null");
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Auth] getSession user:", session?.user?.id ?? "null");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoadedUserId(null);
      return;
    }

    if (loadedUserId === user.id) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("condominio_id, role")
        .eq("user_id", user.id);

      if (cancelled) return;
      if (!error && data) {
        setRoles(data as UserRole[]);
      }
      setLoadedUserId(user.id);
    })();

    return () => { cancelled = true; };
  }, [user, loadedUserId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
  }, []);

  const hasRole = useCallback((condominioId: string, role: AppRole): boolean => {
    return roles.some(
      (r) => r.condominio_id === condominioId && r.role === role
    );
  }, [roles]);

  const isPlatformAdmin = roles.some((r) => r.role === "platform_admin");

  // Track device info for support/debugging
  useDeviceInfo(user?.id);

  // Register for push notifications (native only)
  usePushNotifications(user?.id);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, roles, rolesLoading, signOut, hasRole, isPlatformAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

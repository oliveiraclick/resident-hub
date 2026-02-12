import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "morador" | "prestador" | "admin";

interface UserRole {
  condominio_id: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }

    const fetchRoles = async () => {
      setRolesLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("condominio_id, role")
        .eq("user_id", user.id);

      if (!error && data) {
        setRoles(data as UserRole[]);
      }
      setRolesLoading(false);
    };

    fetchRoles();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (condominioId: string, role: AppRole): boolean => {
    return roles.some(
      (r) => r.condominio_id === condominioId && r.role === role
    );
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, roles, rolesLoading, signOut, hasRole }}
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

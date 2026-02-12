import { ReactNode, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Home, Wrench, ShoppingBag, Package, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface MoradorLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showNav?: boolean;
  showSearch?: boolean;
}

const navItems = [
  { icon: Home, label: "Início", path: "/morador" },
  { icon: Wrench, label: "Serviços", path: "/morador/servicos" },
  { icon: ShoppingBag, label: "Shop", path: "/morador/produtos" },
  { icon: Package, label: "Encomendas", path: "/morador/encomendas" },
  { icon: User, label: "Perfil", path: "/morador/perfil" },
];

const MoradorLayout = ({ children, showSearch = false }: MoradorLayoutProps) => {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.nome) setProfileName(data.nome);
    };
    fetchProfile();
  }, [user]);

  const userName = profileName || (user?.user_metadata?.nome as string) || "Morador";

  return (
    <AppShell moduleName="Morador" navItems={navItems} userName={userName} showSearch={showSearch}>
      {children}
    </AppShell>
  );
};

export default MoradorLayout;

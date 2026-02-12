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
  const [condominioName, setCondominioName] = useState<string | null>(null);
  const [condominioLogo, setCondominioLogo] = useState<string | null>(null);
  const [aprovado, setAprovado] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch profile, role and condominio in parallel
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("condominio_id, aprovado").eq("user_id", user.id).eq("role", "morador").maybeSingle(),
      ]);

      if (profileRes.data?.nome) setProfileName(profileRes.data.nome);

      if (roleRes.data) {
        setAprovado(roleRes.data.aprovado ?? true);

        if (roleRes.data.condominio_id) {
          const { data: condo } = await supabase
            .from("condominios")
            .select("nome, logo_url")
            .eq("id", roleRes.data.condominio_id)
            .maybeSingle();

          if (condo) {
            setCondominioName(condo.nome);
            setCondominioLogo(condo.logo_url);
          }
        }
      }
    };

    fetchData();
  }, [user]);

  const userName = profileName || (user?.user_metadata?.nome as string) || "Morador";

  return (
    <AppShell
      moduleName="Morador"
      navItems={navItems}
      userName={userName}
      showSearch={showSearch}
      condominioName={condominioName}
      condominioLogo={condominioLogo}
      aprovado={aprovado}
    >
      {children}
    </AppShell>
  );
};

export default MoradorLayout;

import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { Home, Wrench, Package, DollarSign, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MoradorLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showNav?: boolean;
  showSearch?: boolean;
}

const navItems = [
  { icon: Home, label: "Home", path: "/morador" },
  { icon: Wrench, label: "Serviços", path: "/morador/servicos" },
  { icon: Package, label: "Encomendas", path: "/morador/encomendas" },
  { icon: DollarSign, label: "Financeiro", path: "/morador/desapegos" },
  { icon: User, label: "Perfil", path: "/morador/qr-id" },
];

const MoradorLayout = ({ children, showSearch = false }: MoradorLayoutProps) => {
  const { user } = useAuth();
  const userName = (user?.user_metadata?.nome as string) || "Morador";

  return (
    <AppShell moduleName="Morador" navItems={navItems} userName={userName} showSearch={showSearch}>
      {children}
    </AppShell>
  );
};

export default MoradorLayout;

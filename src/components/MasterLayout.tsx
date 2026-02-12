import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { Home, Building2, Users, DollarSign, BarChart3 } from "lucide-react";

interface MasterLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

const navItems = [
  { icon: Home, label: "Home", path: "/master" },
  { icon: Building2, label: "Condomínios", path: "/master/condominios" },
  { icon: Users, label: "Usuários", path: "/master/usuarios" },
  { icon: DollarSign, label: "Financeiro", path: "/master/financeiro" },
  { icon: BarChart3, label: "Métricas", path: "/master/metricas" },
];

const MasterLayout = ({ children }: MasterLayoutProps) => {
  return (
    <AppShell moduleName="Master" navItems={navItems}>
      {children}
    </AppShell>
  );
};

export default MasterLayout;

import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { Home, Building2, Users, DollarSign, User, Wrench, Image, Layout, Tag, FileCheck, Bell, Merge, ScrollText, FlaskConical, BarChart3 } from "lucide-react";
import { useBannerSolicitacaoAlert } from "@/hooks/useBannerSolicitacaoAlert";

interface MasterLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

const navItems = [
  { icon: Home, label: "Home", path: "/master" },
  { icon: Users, label: "Usuários", path: "/master/usuarios" },
  { icon: User, label: "Perfil", path: "/master/perfil" },
];

const menuItems = [
  { icon: Building2, label: "Condomínios", path: "/master/condominios" },
  { icon: Wrench, label: "Categorias", path: "/master/categorias" },
  { icon: Image, label: "Banners", path: "/master/banners" },
  { icon: Tag, label: "Preços Banners", path: "/master/banner-precos" },
  { icon: FileCheck, label: "Solicitações Banners", path: "/master/banner-solicitacoes" },
  { icon: Layout, label: "Landing Page", path: "/master/lp" },
  { icon: DollarSign, label: "Financeiro", path: "/master/financeiro" },
  { icon: Bell, label: "Push", path: "/master/push" },
  { icon: Merge, label: "Unificar Contas", path: "/master/merge-contas" },
  { icon: ScrollText, label: "Logs Auth", path: "/master/logs" },
  { icon: FlaskConical, label: "Simulação", path: "/master/simulacao" },
  { icon: BarChart3, label: "Observabilidade", path: "/master/observabilidade" },
];

const MasterLayout = ({ children }: MasterLayoutProps) => {
  useBannerSolicitacaoAlert();

  return (
    <AppShell moduleName="Master" navItems={navItems} menuItems={menuItems}>
      {children}
    </AppShell>
  );
};

export default MasterLayout;

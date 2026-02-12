import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { Home, Wrench, Package, DollarSign, User } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

const navItems = [
  { icon: Home, label: "Home", path: "/admin" },
  { icon: Wrench, label: "Serviços", path: "/admin/encomendas" },
  { icon: Package, label: "Encomendas", path: "/admin/encomendas/triagem" },
  { icon: DollarSign, label: "Financeiro", path: "/admin/encomendas/historico" },
  { icon: User, label: "Perfil", path: "/admin/encomendas/retirada" },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <AppShell moduleName="Admin" navItems={navItems}>
      {children}
    </AppShell>
  );
};

export default AdminLayout;

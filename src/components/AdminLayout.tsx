import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { Home, Package, DollarSign, Users, User } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

const navItems = [
  { icon: Home, label: "Home", path: "/admin" },
  { icon: Package, label: "Encomendas", path: "/admin/encomendas" },
  { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
  { icon: User, label: "Perfil", path: "/admin/perfil" },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <AppShell moduleName="Admin" navItems={navItems}>
      {children}
    </AppShell>
  );
};

export default AdminLayout;

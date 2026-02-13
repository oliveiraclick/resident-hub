import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { Home, Wrench, ShoppingBag, DollarSign, User } from "lucide-react";

interface PrestadorLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

const navItems = [
  { icon: Home, label: "Home", path: "/prestador" },
  { icon: Wrench, label: "Serviços", path: "/prestador/servicos" },
  { icon: ShoppingBag, label: "Produtos", path: "/prestador/produtos" },
  { icon: DollarSign, label: "Financeiro", path: "/prestador/financeiro" },
  { icon: User, label: "Perfil", path: "/prestador/perfil" },
];

const PrestadorLayout = ({ children, title, showBack }: PrestadorLayoutProps) => {
  return (
    <AppShell moduleName="Prestador" navItems={navItems} title={title} showBack={showBack}>
      {children}
    </AppShell>
  );
};

export default PrestadorLayout;

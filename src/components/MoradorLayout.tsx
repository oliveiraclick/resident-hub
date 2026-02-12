import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { Home, Wrench, Package, DollarSign, User } from "lucide-react";

interface MoradorLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showNav?: boolean;
}

const navItems = [
  { icon: Home, label: "Home", path: "/morador" },
  { icon: Wrench, label: "Serviços", path: "/morador/servicos" },
  { icon: Package, label: "Encomendas", path: "/morador/encomendas" },
  { icon: DollarSign, label: "Financeiro", path: "/morador/desapegos" },
  { icon: User, label: "Perfil", path: "/morador/qr-id" },
];

const MoradorLayout = ({ children }: MoradorLayoutProps) => {
  return (
    <AppShell moduleName="Morador" navItems={navItems}>
      {children}
    </AppShell>
  );
};

export default MoradorLayout;

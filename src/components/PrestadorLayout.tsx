import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { Home, Wrench, ShoppingBag, DollarSign, User, Image, Store, ClipboardList, UtensilsCrossed, Star } from "lucide-react";

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

const menuItems = [
  { icon: Store, label: "Minha Loja", path: "/prestador/loja" },
  { icon: UtensilsCrossed, label: "Cardápio", path: "/prestador/cardapio" },
  { icon: ClipboardList, label: "Pedidos", path: "/prestador/pedidos" },
  { icon: Image, label: "Banners", path: "/prestador/banners" },
  { icon: Star, label: "Avaliações", path: "/prestador/avaliacoes" },
];

const PrestadorLayout = ({ children, title, showBack }: PrestadorLayoutProps) => {
  return (
    <AppShell moduleName="Prestador" navItems={navItems} menuItems={menuItems} title={title} showBack={showBack}>
      {children}
    </AppShell>
  );
};

export default PrestadorLayout;

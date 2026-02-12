import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Home, Wrench, Repeat, ShoppingBag, Package, QrCode, Star } from "lucide-react";

interface MoradorLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
  showNav?: boolean;
}

const navItems = [
  { icon: Home, label: "Home", path: "/morador" },
  { icon: Wrench, label: "Serviços", path: "/morador/servicos" },
  { icon: Repeat, label: "Desapego", path: "/morador/desapegos" },
  { icon: ShoppingBag, label: "E-shop", path: "/morador/produtos" },
  { icon: Package, label: "Pacotes", path: "/morador/encomendas" },
];

const MoradorLayout = ({ children, title, showBack = false, showNav = true }: MoradorLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="text-foreground p-1">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-title-md">{title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">{children}</main>

      {/* Bottom Nav */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-card">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default MoradorLayout;

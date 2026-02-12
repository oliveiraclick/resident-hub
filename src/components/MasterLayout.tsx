import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Building2, Users, DollarSign, BarChart3 } from "lucide-react";

interface MasterLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
}

const navItems = [
  { label: "Dashboard", path: "/master", icon: LayoutDashboard },
  { label: "Condomínios", path: "/master/condominios", icon: Building2 },
  { label: "Usuários", path: "/master/usuarios", icon: Users },
  { label: "Financeiro", path: "/master/financeiro", icon: DollarSign },
  { label: "Métricas", path: "/master/metricas", icon: BarChart3 },
];

const MasterLayout = ({ children, title, showBack = false }: MasterLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="text-foreground p-1">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-title-md">🛡️ {title}</h1>
        </div>
      </header>

      <nav className="border-b border-border bg-card px-4 py-2 overflow-x-auto">
        <div className="flex gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-button)] text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="p-4">{children}</main>
    </div>
  );
};

export default MasterLayout;

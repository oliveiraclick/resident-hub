import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface AppShellProps {
  children: ReactNode;
  moduleName: string;
  navItems: NavItem[];
  userName?: string;
  showSearch?: boolean;
}

const AppShell = ({ children, moduleName, navItems, userName, showSearch = false }: AppShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background mx-auto max-w-[480px]">
      {/* TopBar */}
      <header className="sticky top-0 z-20 bg-card px-5 pt-4 pb-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-[15px] text-foreground tracking-tight">Splendido</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Bell size={18} className="text-muted-foreground" />
            </button>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              <span className="text-primary font-semibold text-xs">
                {(userName || moduleName).charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Greeting */}
        {userName && (
          <div className="mb-3">
            <p className="text-muted-foreground text-[13px]">Olá,</p>
            <h1 className="text-[20px] font-bold text-foreground leading-tight">{userName} 👋</h1>
          </div>
        )}

        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar serviços, produtos..."
              className="w-full h-11 rounded-full bg-muted pl-11 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground outline-none border-0 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}
      </header>

      {/* Scrollable content */}
      <main className="px-5 pt-6 pb-[90px]">{children}</main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-20 w-full max-w-[480px] bg-card"
        style={{ height: 70, borderTop: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map((item) => {
            const isActive =
              item.path === navItems[0]?.path
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[52px]"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                  <item.icon
                    size={20}
                    className={isActive ? "text-primary" : "text-muted-foreground"}
                  />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;

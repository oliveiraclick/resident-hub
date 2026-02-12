import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, User } from "lucide-react";
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
}

const AppShell = ({ children, moduleName, navItems }: AppShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background mx-auto max-w-[480px]">
      {/* TopBar - 64px */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 bg-card"
        style={{ height: 64, borderBottom: "1px solid #E2E8F0" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold text-lg">M</span>
          <span className="font-semibold text-sm text-foreground">{moduleName}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground p-1">
            <Bell size={20} />
          </button>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <User size={16} className="text-muted-foreground" />
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="px-4 pt-6 pb-[90px]">{children}</main>

      {/* Bottom Navigation - 70px */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-20 w-full max-w-[480px] bg-card"
        style={{ height: 70, borderTop: "1px solid #E2E8F0" }}
      >
        <div className="flex items-center justify-around h-full">
          {navItems.map((item) => {
            const isActive =
              item.path === navItems[0]?.path
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-2 py-1"
              >
                <item.icon
                  size={22}
                  className={isActive ? "text-primary" : "text-[#64748B]"}
                />
                {isActive && (
                  <span className="text-[10px] font-semibold text-primary">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;

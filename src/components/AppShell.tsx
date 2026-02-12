import { ReactNode, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, QrCode, Search, Wrench, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoMorador from "@/assets/logo-morador.png";
import { useAuth } from "@/hooks/useAuth";

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
  onQrPress?: () => void;
}

interface SearchResult {
  id: string;
  especialidade: string;
  descricao: string | null;
}

const AppShell = ({ children, moduleName, navItems, userName, showSearch = false, onQrPress }: AppShellProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Always scroll to top on mount / route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Live search
  useEffect(() => {
    if (!searchTerm.trim() || !user) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("prestadores")
        .select("id, especialidade, descricao")
        .ilike("especialidade", `%${searchTerm.trim()}%`)
        .limit(8);

      if (data && data.length > 0) {
        // Deduplicate by especialidade
        const unique = data.reduce((acc: SearchResult[], curr) => {
          if (!acc.find((r) => r.especialidade === curr.especialidade)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        setResults(unique);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(true);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, user]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectResult = (especialidade: string) => {
    setSearchTerm("");
    setShowResults(false);
    navigate(`/morador/servicos?q=${encodeURIComponent(especialidade)}`);
  };

  return (
    <div className="min-h-screen bg-background mx-auto max-w-[480px] overflow-x-hidden">
      {/* TopBar */}
      <header className="sticky top-0 z-20 bg-card px-5 pt-4 pb-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <img src={logoMorador} alt="Morador.app" className="h-9 w-9 object-contain" />
            <span className="font-semibold text-[15px] text-foreground tracking-tight">Morador.app</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onQrPress || (() => navigate("/morador/qr-id"))}
              className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
            >
              <QrCode size={18} className="text-muted-foreground" />
            </button>
            <button className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Bell size={18} className="text-muted-foreground" />
            </button>
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
          <div ref={searchRef} className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if (results.length > 0) setShowResults(true); }}
              placeholder="Buscar prestadores, serviços..."
              className="w-full h-11 rounded-full bg-muted pl-11 pr-10 text-[13px] text-foreground placeholder:text-muted-foreground outline-none border-0 focus:ring-2 focus:ring-primary/20"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(""); setShowResults(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X size={14} />
              </button>
            )}

            {/* Dropdown results */}
            {showResults && searchTerm.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-2xl shadow-lg border overflow-hidden z-30 max-h-[280px] overflow-y-auto">
                {results.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-muted-foreground text-center">
                    Nenhum resultado para "{searchTerm}"
                  </div>
                ) : (
                  results.map((r) => (
                    <button
                      key={r.especialidade}
                      onClick={() => handleSelectResult(r.especialidade)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Wrench size={16} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{r.especialidade}</p>
                        {r.descricao && (
                          <p className="text-[11px] text-muted-foreground truncate">{r.descricao}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
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

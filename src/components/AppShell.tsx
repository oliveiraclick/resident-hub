import { ReactNode, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell, QrCode, Search, Wrench, X, Sparkles } from "lucide-react";
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
  condominioName?: string | null;
  condominioLogo?: string | null;
  aprovado?: boolean;
  title?: string;
  showBack?: boolean;
}

interface SearchResult {
  id: string;
  especialidade: string;
  descricao: string | null;
}

const AppShell = ({ children, moduleName, navItems, userName, showSearch = false, onQrPress, condominioName, condominioLogo, aprovado = true, title, showBack = false }: AppShellProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isHome = navItems.length > 0 && location.pathname === navItems[0]?.path;

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

  const firstName = userName?.split(" ")[0] || "Morador";

  return (
    <div className="min-h-screen bg-background mx-auto max-w-[480px] overflow-x-hidden">
      {/* ═══ HERO HEADER ═══ */}
      {isHome && !showBack ? (
        <div className="relative overflow-hidden">
          {/* Gradient background */}
          <div
            className="text-primary-foreground"
            style={{
              background: "linear-gradient(145deg, hsl(var(--header-bg)) 0%, hsl(var(--header-mid)) 40%, hsl(var(--primary)) 100%)",
              padding: "48px 20px 80px",
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute top-5 -right-8 w-44 h-44 rounded-full opacity-100" style={{ background: "hsla(var(--primary), 0.15)", filter: "blur(40px)" }} />
            <div className="absolute bottom-10 -left-10 w-30 h-30 rounded-full" style={{ background: "hsla(var(--primary), 0.1)", filter: "blur(30px)" }} />

            {/* Top row */}
            <div className="flex justify-between items-center mb-7 relative z-[2]">
              <div className="flex items-center gap-2.5">
                {condominioLogo ? (
                  <img src={condominioLogo} alt={condominioName || ""} className="h-[38px] w-[38px] rounded-xl object-cover border-2 border-white/20" />
                ) : (
                  <img src={logoMorador} alt="Morador.app" className="h-[38px] w-[38px] object-contain" />
                )}
                <div>
                  <span className="font-bold text-[16px] block leading-none text-white">
                    {condominioName || "Morador.app"}
                  </span>
                  <span className="text-[10px] text-primary-light font-medium tracking-wider uppercase">Seu condomínio digital</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onQrPress || (() => navigate("/morador/qr-id"))}
                  className="w-[42px] h-[42px] rounded-[14px] flex items-center justify-center border cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <QrCode size={20} className="text-white" />
                </button>
                <button
                  className="w-[42px] h-[42px] rounded-[14px] flex items-center justify-center border cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <Bell size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Big greeting */}
            <div className="relative z-[2]">
              <p className="text-[14px] text-primary-light font-medium m-0">Bem-vindo de volta,</p>
              <h1 className="text-[32px] font-extrabold mt-1 leading-none tracking-tight text-white">{firstName} <span className="text-[28px]">🔥</span></h1>
            </div>
          </div>

          {/* Wave cutout */}
          <svg viewBox="0 0 430 40" className="absolute bottom-0 left-0 w-full block">
            <path d="M0,20 Q107,45 215,20 Q323,-5 430,20 L430,40 L0,40 Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      ) : (
        /* ═══ SUBPAGE HEADER ═══ */
        <header
          className="sticky top-0 z-20 px-5 pt-4 pb-3 text-white"
          style={{
            background: "linear-gradient(145deg, hsl(var(--header-bg)) 0%, hsl(var(--header-mid)) 60%, hsl(var(--primary)) 100%)",
            borderBottom: "none",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {condominioLogo ? (
                <img src={condominioLogo} alt={condominioName || "Condomínio"} className="h-9 w-9 rounded-lg object-cover border border-white/20" />
              ) : (
                <img src={logoMorador} alt="Morador.app" className="h-9 w-9 object-contain" />
              )}
              <span className="font-semibold text-[15px] text-white tracking-tight">
                {condominioName || "Morador.app"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onQrPress || (() => navigate("/morador/qr-id"))}
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <QrCode size={18} className="text-white/80" />
              </button>
              <button
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <Bell size={18} className="text-white/80" />
              </button>
            </div>
          </div>

          {/* Back + Title */}
          {showBack && title && (
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                <ArrowLeft size={18} className="text-white" />
              </button>
              <h1 className="text-[17px] font-bold text-white">{title}</h1>
            </div>
          )}
        </header>
      )}

      {/* Floating search bar (home only) */}
      {isHome && showSearch && (
        <div ref={searchRef} className="px-5 relative z-10" style={{ marginTop: -28 }}>
          <div className="bg-card rounded-2xl py-3.5 px-[18px] flex items-center gap-3 border border-border" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
            <Search size={18} className="text-primary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if (results.length > 0) setShowResults(true); }}
              placeholder="Buscar prestadores, serviços..."
              className="flex-1 text-[14px] text-foreground placeholder:text-muted-foreground outline-none border-0 bg-transparent"
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(""); setShowResults(false); }} className="text-muted-foreground">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {showResults && searchTerm.trim() && (
            <div className="absolute top-full left-5 right-5 mt-1 bg-card rounded-2xl shadow-lg border overflow-hidden z-30 max-h-[280px] overflow-y-auto">
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

      {/* Search bar for subpages */}
      {!isHome && showSearch && (
        <div ref={searchRef} className="px-5 pt-3 relative">
          <div className="relative">
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
              <button onClick={() => { setSearchTerm(""); setShowResults(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X size={14} />
              </button>
            )}
          </div>

          {showResults && searchTerm.trim() && (
            <div className="absolute top-full left-5 right-5 mt-1 bg-card rounded-2xl shadow-lg border overflow-hidden z-30 max-h-[280px] overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-3 text-[13px] text-muted-foreground text-center">Nenhum resultado para "{searchTerm}"</div>
              ) : (
                results.map((r) => (
                  <button key={r.especialidade} onClick={() => handleSelectResult(r.especialidade)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors text-left">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Wrench size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{r.especialidade}</p>
                      {r.descricao && <p className="text-[11px] text-muted-foreground truncate">{r.descricao}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Pending approval banner */}
      {!aprovado && (
        <div className="mx-5 mt-4 rounded-2xl bg-card border border-border px-4 py-3.5" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <p className="text-[14px] font-semibold text-foreground m-0">⏳ Cadastro em análise</p>
          <p className="text-[13px] text-muted-foreground mt-1 m-0">Seu acesso está pendente de aprovação.</p>
        </div>
      )}

      {/* Scrollable content */}
      <main className="px-5 pt-6 pb-[100px]">{children}</main>

      {/* ═══ BOTTOM NAV — Pill Style ═══ */}
      <nav
        className="fixed z-20"
        style={{
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 40px)",
          maxWidth: 390,
          background: "hsl(var(--header-bg))",
          borderRadius: 22,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          height: 64,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        {navItems.map((item) => {
          const isActive =
            item.path === navItems[0]?.path
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-[3px] border-none cursor-pointer"
              style={{
                background: isActive ? "hsla(var(--primary), 0.15)" : "transparent",
                padding: "8px 14px",
                borderRadius: 14,
              }}
            >
              <item.icon
                size={20}
                color={isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.45)"}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.45)",
                  letterSpacing: 0.3,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AppShell;

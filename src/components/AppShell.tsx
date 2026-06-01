import { ReactNode, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell, QrCode, Search, Wrench, X, Sparkles, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import logoSymbol from "@/assets/logo-symbol.png";
import copaBanner from "@/assets/copa-banner.png";
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
  menuItems?: NavItem[];
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
  nome: string;
  especialidade: string;
  descricao: string | null;
}

interface PrestadorSearchItem {
  id: string;
  user_id: string;
  nome: string;
  especialidade: string;
  descricao: string | null;
}

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const AppShell = ({ children, moduleName, navItems, menuItems, userName, showSearch = false, onQrPress, condominioName, condominioLogo, aprovado = true, title, showBack = false }: AppShellProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchIndex, setSearchIndex] = useState<PrestadorSearchItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isHome = navItems.length > 0 && location.pathname === navItems[0]?.path;

  // Always scroll to top on mount / route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Load searchable prestadores index (nome + especialidade)
  useEffect(() => {
    if (!user || !showSearch) return;

    let isActive = true;

    const loadSearchIndex = async () => {
      const { data: prestadores } = await supabase
        .from("prestadores")
        .select("id, user_id, especialidade, descricao")
        .limit(500);

      if (!prestadores || prestadores.length === 0) {
        if (isActive) setSearchIndex([]);
        return;
      }

      const userIds = [...new Set(prestadores.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .rpc("get_prestador_profiles", { _user_ids: userIds }) as { data: { user_id: string; nome: string }[] | null };

      const nomePorUserId = new Map((profiles || []).map((p) => [p.user_id, p.nome]));

      const indexData: PrestadorSearchItem[] = prestadores.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        especialidade: p.especialidade,
        descricao: p.descricao,
        nome: nomePorUserId.get(p.user_id) || "Prestador",
      }));

      if (isActive) setSearchIndex(indexData);
    };

    loadSearchIndex();

    return () => {
      isActive = false;
    };
  }, [user, showSearch]);

  // Live search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(() => {
      const term = normalizeSearchText(searchTerm);

      const filtered = searchIndex
        .filter((item) => {
          const nome = normalizeSearchText(item.nome);
          const especialidade = normalizeSearchText(item.especialidade);
          return nome.includes(term) || especialidade.includes(term);
        })
        .slice(0, 8)
        .map((item) => ({
          id: item.id,
          nome: item.nome,
          especialidade: item.especialidade,
          descricao: item.descricao,
        }));

      setResults(filtered);
      setShowResults(true);
    }, 180);

    return () => clearTimeout(timer);
  }, [searchTerm, searchIndex]);

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

  const handleSelectResult = (result: SearchResult) => {
    setSearchTerm("");
    setShowResults(false);
    // Check if user typed something matching the name → navigate with prestador name
    const term = normalizeSearchText(searchTerm);
    const nameMatch = normalizeSearchText(result.nome).includes(term);
    const espMatch = normalizeSearchText(result.especialidade).includes(term);
    
    if (nameMatch && !espMatch) {
      // Searched by name → go to category but filter by name
      navigate(`/morador/servicos?q=${encodeURIComponent(result.especialidade)}&nome=${encodeURIComponent(result.nome)}`);
    } else {
      // Searched by especialidade → show all in category
      navigate(`/morador/servicos?q=${encodeURIComponent(result.especialidade)}`);
    }
  };

  const firstName = userName?.split(" ")[0] || "Morador";
  const isMoradorModule = moduleName === "Morador";

  return (
    <div data-module={moduleName} className="min-h-screen flex flex-col bg-background mx-auto w-full max-w-full overflow-x-hidden relative">
      {/* ═══ HERO HEADER ═══ */}
      {isHome && !showBack ? (
        <div className="relative overflow-hidden">
          {/* Header background with glassmorphism feel */}
          <div
            className="text-primary-foreground relative z-10"
            style={{
              background: isMoradorModule
                ? `url(${copaBanner}) center right / cover no-repeat, #009739`
                : "linear-gradient(135deg, hsl(var(--header-bg)) 0%, hsl(var(--header-mid)) 100%)",
              padding: "40px 20px 60px",
            }}
          >
            {/* Soft decorative elements */}
            {isMoradorModule && <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/45 via-black/15 to-transparent pointer-events-none" />}
            {!isMoradorModule && <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />}
            {!isMoradorModule && <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4" />}

            <div className="flex items-center gap-3 mb-8 relative z-20">
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  {condominioLogo ? (
                    <img src={condominioLogo} alt={condominioName || ""} className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/10 shadow-lg" />
                  ) : (
                    <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20">
                      <img src={logoSymbol} alt="Morador.app" className="h-8 w-8 object-contain" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight text-white leading-none mb-1 whitespace-nowrap">
                    {condominioName || "Morador.app"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] text-white/60 font-semibold tracking-widest uppercase">Digital & Seguro</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={onQrPress || (() => navigate("/morador/qr-id"))}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 backdrop-blur-md transition-all shadow-md ${isMoradorModule ? "bg-black/40 hover:bg-black/55 ring-1 ring-white/20" : "bg-white/10 hover:bg-white/20 ring-1 ring-white/10"}`}
                >
                  <QrCode size={20} className="text-white" />
                </button>
                <button
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 backdrop-blur-md transition-all shadow-md ${isMoradorModule ? "bg-black/40 hover:bg-black/55 ring-1 ring-white/20" : "bg-white/10 hover:bg-white/20 ring-1 ring-white/10"}`}
                >
                  <Bell size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Big greeting */}
            <div className="relative z-20 space-y-1">
              <p className="text-sm font-medium text-white/70">Olá, bem-vindo!</p>
              <h1 className="text-4xl font-black tracking-tight text-white">{firstName}</h1>
            </div>
          </div>

          {/* Clean transition to content */}
          <div className="h-10 -mt-10 bg-background rounded-t-[40px] relative z-20" />
        </div>
      ) : (
        /* ═══ SUBPAGE HEADER ═══ */
        <header
          className="sticky top-0 z-30 px-5 pt-4 pb-4 backdrop-blur-xl border-b border-white/5"
          style={{
            background: "linear-gradient(145deg, hsl(var(--header-bg)) 0%, hsl(var(--header-mid)) 40%, hsl(var(--primary)) 100%)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {showBack ? (
                <button 
                  onClick={() => navigate(-1)} 
                  className="h-10 w-10 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all active:scale-95"
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
              ) : (
                condominioLogo ? (
                  <img src={condominioLogo} alt={condominioName || "Condomínio"} className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10" />
                ) : (
                  <img src={logoSymbol} alt="Morador.app" className="h-10 w-10 object-contain" />
                )
              )}
              {title && (
                <h1 className="text-lg font-bold text-white truncate max-w-[180px] sm:max-w-none">
                  {title}
                </h1>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onQrPress || (() => navigate("/morador/qr-id"))}
                className="h-10 w-10 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all"
              >
                <QrCode size={18} className="text-white" />
              </button>
              <button
                className="h-10 w-10 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all"
              >
                <Bell size={18} className="text-white" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Floating search bar (home only) */}
      {isHome && showSearch && (
        <div ref={searchRef} className="px-5 relative z-30" style={{ marginTop: -44 }}>
          <div className="bg-card rounded-[24px] py-4 px-5 flex items-center gap-4 border border-border shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search size={20} className="text-primary shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if (results.length > 0) setShowResults(true); }}
              placeholder="Buscar serviços ou prestadores..."
              className="flex-1 text-[15px] font-medium text-foreground placeholder:text-muted-foreground outline-none border-0 bg-transparent"
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(""); setShowResults(false); }} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
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
                    key={r.id}
                    onClick={() => handleSelectResult(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Wrench size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{r.nome}</p>
                      <p className="text-[11px] text-primary truncate">{r.especialidade}</p>
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
                  <button key={r.id} onClick={() => handleSelectResult(r)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors text-left">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Wrench size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{r.nome}</p>
                      <p className="text-[11px] text-primary truncate">{r.especialidade}</p>
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
      <main className="px-5 pt-6 pb-[100px] flex-1">{children}</main>

      {/* ═══ BOTTOM NAV — Modern Pill Style ═══ */}
      <nav
        className="fixed z-40"
        style={{
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: 480,
          background: "rgba(22, 23, 28, 0.9)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderRadius: 28,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          height: 72,
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
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
              className="flex flex-col items-center justify-center gap-1.5 border-none cursor-pointer relative group transition-all"
              style={{
                width: 64,
                height: 56,
              }}
            >
              {isActive && (
                <div 
                  className="absolute inset-0 bg-primary/10 rounded-2xl animate-in fade-in zoom-in-95 duration-200"
                />
              )}
              <item.icon
                size={22}
                className={`transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-white/40 group-hover:text-white/60'}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] tracking-wide transition-all duration-300 ${isActive ? 'font-bold text-primary opacity-100' : 'font-medium text-white/40 opacity-70'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
        {menuItems && menuItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col items-center gap-[3px] border-none cursor-pointer"
              style={{
                background: menuOpen || menuItems.some(mi => location.pathname.startsWith(mi.path))
                  ? "hsla(var(--primary), 0.15)" : "transparent",
                padding: "8px 14px",
                borderRadius: 14,
              }}
            >
              <Menu
                size={20}
                color={menuOpen || menuItems.some(mi => location.pathname.startsWith(mi.path))
                  ? "hsl(var(--primary))" : "rgba(255,255,255,0.45)"}
                strokeWidth={menuOpen || menuItems.some(mi => location.pathname.startsWith(mi.path)) ? 2.5 : 1.8}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: menuOpen || menuItems.some(mi => location.pathname.startsWith(mi.path)) ? 700 : 400,
                  color: menuOpen || menuItems.some(mi => location.pathname.startsWith(mi.path))
                    ? "hsl(var(--primary))" : "rgba(255,255,255,0.45)",
                  letterSpacing: 0.3,
                }}
              >
                Mais
              </span>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute z-20 rounded-xl shadow-lg border border-border overflow-hidden"
                  style={{
                    bottom: "calc(100% + 12px)",
                    right: 0,
                    minWidth: 180,
                    background: "hsl(var(--header-bg))",
                  }}
                >
                  {menuItems.map((mi) => {
                    const isMenuActive = location.pathname.startsWith(mi.path);
                    return (
                      <button
                        key={mi.path}
                        onClick={() => { navigate(mi.path); setMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-3 border-none cursor-pointer"
                        style={{
                          background: isMenuActive ? "hsla(var(--primary), 0.15)" : "transparent",
                        }}
                      >
                        <mi.icon
                          size={18}
                          color={isMenuActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.6)"}
                          strokeWidth={isMenuActive ? 2.5 : 1.8}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: isMenuActive ? 600 : 400,
                            color: isMenuActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.75)",
                          }}
                        >
                          {mi.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </nav>
    </div>
  );
};

export default AppShell;

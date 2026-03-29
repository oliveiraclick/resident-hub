import { ReactNode, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell, QrCode, Search, Wrench, X, Sparkles, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import logoSymbol from "@/assets/logo-symbol.png";
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

  const handleSelectResult = (query: string) => {
    setSearchTerm("");
    setShowResults(false);
    navigate(`/morador/servicos?q=${encodeURIComponent(query)}`);
  };

  const firstName = userName?.split(" ")[0] || "Morador";

  return (
    <div className="min-h-screen flex flex-col bg-background mx-auto max-w-[480px] sm:max-w-[600px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1200px] overflow-x-hidden">
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
                  <img src={logoSymbol} alt="Morador.app" className="h-[48px] w-[48px] object-contain" />
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
              <h1 className="text-[32px] font-extrabold mt-1 leading-none tracking-tight text-white">{firstName}</h1>
            </div>
          </div>

          {/* Wave cutout */}
          <svg viewBox="0 0 430 40" preserveAspectRatio="none" className="absolute -bottom-[1px] left-0 w-full h-[35px] block">
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
                <img src={logoSymbol} alt="Morador.app" className="h-12 w-12 object-contain" />
              )}
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
                    key={r.id}
                    onClick={() => handleSelectResult(r.nome)}
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
                  <button key={r.id} onClick={() => handleSelectResult(r.nome)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors text-left">
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

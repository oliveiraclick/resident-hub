import { useEffect, useState, useRef, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingBag, ChevronLeft, ChevronRight, Repeat, Info, MapPin, ArrowLeft, Bell, QrCode, Search, Wrench, X, Home, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logoMorador from "@/assets/logo-morador.png";

import productBolo from "@/assets/product-bolo.jpg";
import productSabonete from "@/assets/product-sabonete.jpg";
import productBrigadeiro from "@/assets/product-brigadeiro.jpg";
import productVela from "@/assets/product-vela.jpg";
import desapegoBike from "@/assets/desapego-bike.jpg";
import desapegoSofa from "@/assets/desapego-sofa.jpg";
import desapegoLivros from "@/assets/desapego-livros.jpg";
import desapegoCarrinho from "@/assets/desapego-carrinho.jpg";

import { useCategorias } from "@/hooks/useCategorias";
import { getIcon } from "@/lib/iconMap";

const fallbackShopImages = [productBolo, productSabonete, productBrigadeiro, productVela];
const fallbackDesapegoImages = [desapegoBike, desapegoSofa, desapegoLivros, desapegoCarrinho];

/* ── Blue Design System tokens ── */
const B = {
  bg: "#F0F4FA",
  primary: "#1E3A8A",
  primaryLight: "#3B82F6",
  primaryBg: "#EFF6FF",
  primaryBorder: "#BFDBFE",
  primary10: "rgba(30,58,138,0.10)",
  primary5: "rgba(30,58,138,0.05)",
  primary20: "rgba(30,58,138,0.20)",
  dark: "#0F172A",
  card: "#FFFFFF",
  muted: "#64748B",
  mutedBg: "#F1F5F9",
  border: "#E2E8F0",
  white: "#FFFFFF",
  ring20: "rgba(30,58,138,0.20)",
  fgWhite70: "rgba(255,255,255,0.70)",
  fgWhite40: "rgba(255,255,255,0.40)",
  fgWhite50: "rgba(255,255,255,0.50)",
  fgWhite20: "rgba(255,255,255,0.20)",
  fgDark60: "rgba(15,23,42,0.60)",
};

/* ── Search result type ── */
interface SearchResult {
  id: string;
  especialidade: string;
  descricao: string | null;
}

/* ========================================
   PREVIEW SHELL – Replica do AppShell
   ======================================== */
const PreviewShell = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [profileName, setProfileName] = useState<string | null>(null);
  const [condominioName, setCondominioName] = useState<string | null>(null);
  const [condominioLogo, setCondominioLogo] = useState<string | null>(null);
  const [aprovado, setAprovado] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  // Fetch profile + condominio
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("condominio_id, aprovado").eq("user_id", user.id).eq("role", "morador").maybeSingle(),
      ]);
      if (profileRes.data?.nome) setProfileName(profileRes.data.nome);
      if (roleRes.data) {
        setAprovado(roleRes.data.aprovado ?? true);
        if (roleRes.data.condominio_id) {
          const { data: condo } = await supabase.from("condominios").select("nome, logo_url").eq("id", roleRes.data.condominio_id).maybeSingle();
          if (condo) { setCondominioName(condo.nome); setCondominioLogo(condo.logo_url); }
        }
      }
    };
    fetchData();
  }, [user]);

  // Live search
  useEffect(() => {
    if (!searchTerm.trim() || !user) { setResults([]); setShowResults(false); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("prestadores").select("id, especialidade, descricao").ilike("especialidade", `%${searchTerm.trim()}%`).limit(8);
      if (data && data.length > 0) {
        const unique = data.reduce((acc: SearchResult[], curr) => {
          if (!acc.find((r) => r.especialidade === curr.especialidade)) acc.push(curr);
          return acc;
        }, []);
        setResults(unique); setShowResults(true);
      } else { setResults([]); setShowResults(true); }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectResult = (especialidade: string) => {
    setSearchTerm(""); setShowResults(false);
    navigate(`/morador/servicos?q=${encodeURIComponent(especialidade)}`);
  };

  const userName = profileName || (user?.user_metadata?.nome as string) || "Morador";

  const navItems = [
    { icon: Home, label: "Início", path: "/preview-home" },
    { icon: Wrench, label: "Serviços", path: "/morador/servicos" },
    { icon: ShoppingBag, label: "Shop", path: "/morador/produtos" },
    { icon: Package, label: "Encomendas", path: "/morador/encomendas" },
    { icon: User, label: "Perfil", path: "/morador/perfil" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: B.bg, maxWidth: 480, margin: "0 auto", overflowX: "hidden", fontFamily: "Inter, sans-serif" }}>
      {/* TopBar */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: B.card, padding: "16px 20px 12px", borderBottom: `1px solid ${B.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {condominioLogo ? (
              <img src={condominioLogo} alt={condominioName || "Condomínio"} style={{ height: 36, width: 36, borderRadius: 8, objectFit: "cover" }} />
            ) : (
              <img src={logoMorador} alt="Morador.app" style={{ height: 36, width: 36, objectFit: "contain" }} />
            )}
            <span style={{ fontWeight: 600, fontSize: 15, color: B.dark, letterSpacing: -0.3 }}>
              {condominioName || "Morador.app"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => navigate("/morador/qr-id")} style={{ height: 40, width: 40, borderRadius: "50%", background: B.mutedBg, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <QrCode size={18} color={B.muted} />
            </button>
            <button style={{ height: 40, width: 40, borderRadius: "50%", background: B.mutedBg, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <Bell size={18} color={B.muted} />
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: B.muted, fontSize: 13, margin: 0 }}>Olá,</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: B.dark, lineHeight: 1.2, margin: 0 }}>{userName} 👋</h1>
        </div>

        {/* Search */}
        <div ref={searchRef} style={{ position: "relative" }}>
          <Search size={16} color={B.muted} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", zIndex: 10 }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowResults(true); }}
            placeholder="Buscar prestadores, serviços..."
            style={{
              width: "100%", height: 44, borderRadius: 999, background: B.mutedBg,
              paddingLeft: 44, paddingRight: 40, fontSize: 13, color: B.dark,
              border: "none", outline: "none",
            }}
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(""); setShowResults(false); }} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
              <X size={14} color={B.muted} />
            </button>
          )}
          {showResults && searchTerm.trim() && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: B.card, borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", border: `1px solid ${B.border}`, overflow: "hidden", zIndex: 30, maxHeight: 280, overflowY: "auto" }}>
              {results.length === 0 ? (
                <div style={{ padding: "12px 16px", fontSize: 13, color: B.muted, textAlign: "center" }}>Nenhum resultado para "{searchTerm}"</div>
              ) : (
                results.map((r) => (
                  <button key={r.especialidade} onClick={() => handleSelectResult(r.especialidade)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ height: 36, width: 36, borderRadius: "50%", background: B.primary10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Wrench size={16} color={B.primary} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: B.dark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.especialidade}</p>
                      {r.descricao && <p style={{ fontSize: 11, color: B.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.descricao}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </header>

      {/* Pending approval */}
      {!aprovado && (
        <div style={{ margin: "16px 20px 0", borderRadius: 16, background: B.mutedBg, border: `1px solid ${B.border}`, padding: "12px 16px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: B.dark, margin: 0 }}>⏳ Cadastro em análise</p>
          <p style={{ fontSize: 11, color: B.muted, margin: "2px 0 0" }}>Seu acesso está pendente de aprovação. Enquanto isso, você pode visualizar o conteúdo.</p>
        </div>
      )}

      {/* Content */}
      <main style={{ padding: "24px 20px 90px" }}>{children}</main>

      {/* Bottom Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", zIndex: 20, width: "100%", maxWidth: 480, background: B.card, height: 70, borderTop: `1px solid ${B.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: "100%", padding: "0 8px" }}>
          {navItems.map((item) => {
            const isActive = item.path === navItems[0]?.path ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <button key={item.path} onClick={() => navigate(item.path)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 8px", minWidth: 52, background: "none", border: "none", cursor: "pointer" }}>
                <div style={{ height: 32, width: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? B.primary10 : "transparent" }}>
                  <item.icon size={20} color={isActive ? B.primary : B.muted} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 500, color: isActive ? B.primary : B.muted }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

/* ========================================
   PREVIEW HOME – Replica da MoradorHome
   ======================================== */
const PreviewHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categorias: allCategorias } = useCategorias();
  const [pendingCount, setPendingCount] = useState(0);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [desapegos, setDesapegos] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<any[]>([]);
  const [prestadoresVisiveis, setPrestadoresVisiveis] = useState<any[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  const shopRef = useRef<HTMLDivElement>(null);
  const desapegoRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    const fetchPending = async () => {
      const { count } = await supabase.from("pacotes").select("id", { count: "exact", head: true }).eq("morador_id", user.id).in("status", ["RECEBIDO", "AGUARDANDO_RETIRADA", "TRIADO"]);
      setPendingCount(count || 0);
    };
    const fetchProdutos = async () => {
      const { data } = await supabase.from("produtos").select("id, titulo, preco, status").eq("status", "ativo").order("created_at", { ascending: false }).limit(8);
      setProdutos(data || []);
    };
    const fetchDesapegos = async () => {
      const { data } = await supabase.from("desapegos").select("id, titulo, preco, status").eq("status", "ativo").order("created_at", { ascending: false }).limit(8);
      setDesapegos(data || []);
    };
    const fetchBanners = async () => {
      const { data } = await supabase.from("banners").select("*").eq("ativo", true).order("ordem", { ascending: true });
      setBanners(data || []);
    };
    const fetchAvisos = async () => {
      const { data } = await supabase.from("avisos").select("id, texto").eq("ativo", true).order("ordem", { ascending: true });
      setAvisos(data || []);
    };
    const fetchPrestadoresVisiveis = async () => {
      const { data } = await supabase.from("prestadores").select("id, user_id, especialidade, visivel_ate").eq("visivel", true).gt("visivel_ate", new Date().toISOString());
      if (data && data.length > 0) {
        const userIds = data.map((p: any) => p.user_id);
        const { data: profiles } = await supabase.rpc("get_prestador_profiles", { _user_ids: userIds });
        const merged = data.map((p: any) => {
          const profile = (profiles || []).find((pr: any) => pr.user_id === p.user_id);
          return { ...p, nome: profile?.nome || "Prestador", avatar_url: profile?.avatar_url };
        });
        setPrestadoresVisiveis(merged);
      } else { setPrestadoresVisiveis([]); }
    };

    fetchPending(); fetchProdutos(); fetchDesapegos(); fetchBanners(); fetchAvisos(); fetchPrestadoresVisiveis();
  }, [user]);

  return (
    <PreviewShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Serviços */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: B.dark, margin: 0 }}>Serviços</h2>
            <button onClick={() => navigate("/morador/servicos/categorias")} style={{ fontSize: 11, fontWeight: 600, color: B.primary, textTransform: "uppercase", letterSpacing: 0.5, background: "none", border: "none", cursor: "pointer" }}>
              Ver tudo
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {allCategorias.slice(0, 4).map((item) => {
              const Icon = getIcon(item.icone);
              return (
                <button key={item.id} onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(item.nome)}`)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}>
                  <div style={{ height: 56, width: 56, borderRadius: 16, background: B.card, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={22} color={B.primary} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: B.dark, lineHeight: 1.2, textAlign: "center" }}>{item.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prestadores no condomínio */}
        {prestadoresVisiveis.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <MapPin size={16} color={B.primary} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: B.dark, margin: 0 }}>No condomínio agora</h2>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" as any }}>
              {prestadoresVisiveis.map((p) => {
                const mins = Math.max(0, Math.ceil((new Date(p.visivel_ate).getTime() - Date.now()) / 60000));
                return (
                  <button key={p.id} onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(p.especialidade)}`)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, borderRadius: 12, background: B.primary5, border: `1px solid ${B.primary10}`, padding: "12px 16px", cursor: "pointer" }}>
                    <div style={{ height: 40, width: 40, borderRadius: "50%", background: B.primary10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: B.primary }}>{p.nome?.charAt(0)?.toUpperCase() || "P"}</div>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: B.dark, lineHeight: 1.2, margin: 0 }}>{p.nome}</p>
                      <p style={{ fontSize: 11, color: B.primary, fontWeight: 500, margin: 0 }}>{p.especialidade}</p>
                      <p style={{ fontSize: 10, color: B.muted, margin: 0 }}>Disponível por {mins} min</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Encomendas pendentes */}
        {pendingCount > 0 && (
          <button onClick={() => navigate("/morador/encomendas")} style={{ borderRadius: 24, background: B.primary5, padding: 16, display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "left", border: "none", cursor: "pointer" }}>
            <div style={{ height: 48, width: 48, borderRadius: 16, background: B.primary10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={24} color={B.primary} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: B.dark, margin: 0 }}>Você tem {pendingCount} encomenda{pendingCount > 1 ? "s" : ""}!</p>
              <p style={{ fontSize: 12, color: B.muted, margin: "2px 0 0" }}>Confira suas entregas pendentes</p>
            </div>
          </button>
        )}

        {/* Banners */}
        {banners.length > 0 && (
          <div onClick={() => { const link = banners[bannerIdx]?.link; if (link) window.open(link, "_blank"); }} style={{ borderRadius: 24, overflow: "hidden", position: "relative", height: 160, cursor: "pointer" }}>
            {banners[bannerIdx]?.imagem_url ? (
              <img src={banners[bannerIdx].imagem_url} alt={banners[bannerIdx].titulo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: B.primary20 }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${B.fgDark60}, transparent)` }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", padding: 16 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: B.white, lineHeight: 1.2, margin: 0 }}>{banners[bannerIdx]?.titulo}</p>
              {banners[bannerIdx]?.subtitulo && <p style={{ fontSize: 11, color: B.fgWhite70, margin: "4px 0 0" }}>{banners[bannerIdx].subtitulo}</p>}
            </div>
            {banners.length > 1 && (
              <div style={{ position: "absolute", bottom: 8, right: 12, zIndex: 1, display: "flex", gap: 4 }}>
                {banners.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }} style={{ width: 8, height: 8, borderRadius: "50%", background: i === bannerIdx ? B.white : B.fgWhite40, border: "none", cursor: "pointer" }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* News ticker */}
        {avisos.length > 0 && (
          <div style={{ borderRadius: 999, background: B.primary, padding: "10px 16px", overflow: "hidden", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: B.white, textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0, background: B.fgWhite20, padding: "2px 10px", borderRadius: 999 }}>News</span>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p style={{ whiteSpace: "nowrap", animation: "ticker 18s linear infinite", fontSize: 12, fontWeight: 500, color: B.white, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  {avisos.map((a: any, i: number) => (
                    <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {i > 0 && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: B.fgWhite50, margin: "0 8px", flexShrink: 0 }} />}
                      <span>📢</span>
                      <span>{a.texto}</span>
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vitrine E-shop */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: B.muted, background: B.mutedBg, padding: "2px 10px", borderRadius: 999 }}>De prestadores</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShoppingBag size={16} color={B.primary} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: B.dark, margin: 0 }}>Vitrine E-shop</h2>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button style={{ color: B.muted, background: "none", border: "none", cursor: "pointer" }}><Info size={14} /></button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" style={{ maxWidth: 200, fontSize: 12 }}>Produtos e serviços oferecidos por prestadores cadastrados na plataforma.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <button onClick={() => navigate("/morador/produtos")} style={{ fontSize: 11, fontWeight: 600, color: B.primary, textTransform: "uppercase", letterSpacing: 0.5, background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => scrollCarousel(shopRef, "left")} style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10, height: 32, width: 32, borderRadius: "50%", background: B.card, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <ChevronLeft size={16} color={B.dark} />
            </button>
            <div ref={shopRef} style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 4px 8px", scrollbarWidth: "none" as any }}>
              {(produtos.length > 0 ? produtos : [
                { id: "mock-1", titulo: "Bolo Caseiro", preco: 25, status: "ativo" },
                { id: "mock-2", titulo: "Sabonete Artesanal", preco: 12, status: "ativo" },
                { id: "mock-3", titulo: "Brigadeiro Gourmet", preco: 3.5, status: "ativo" },
                { id: "mock-4", titulo: "Vela Aromática", preco: 18, status: "ativo" },
              ]).map((product: any, idx: number) => (
                <button key={product.id} onClick={() => product.id.startsWith("mock") ? navigate("/morador/produtos") : navigate(`/morador/produtos/${product.id}`)} style={{ flexShrink: 0, width: 140, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ borderRadius: 20, overflow: "hidden", background: B.card, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div style={{ height: 100, overflow: "hidden" }}>
                      <img src={fallbackShopImages[idx % fallbackShopImages.length]} alt={product.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: 12 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: B.primary, textTransform: "uppercase" }}>Loja</span>
                      <p style={{ fontSize: 13, fontWeight: 500, color: B.dark, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.titulo}</p>
                      {product.preco != null && <p style={{ fontSize: 13, fontWeight: 700, color: B.primary, margin: "4px 0 0" }}>R$ {Number(product.preco).toFixed(2).replace(".", ",")}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => scrollCarousel(shopRef, "right")} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10, height: 32, width: 32, borderRadius: "50%", background: B.card, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <ChevronRight size={16} color={B.dark} />
            </button>
          </div>
        </div>

        {/* Separador */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: B.border }} />
          <span style={{ fontSize: 10, color: B.muted, fontWeight: 500 }}>•</span>
          <div style={{ flex: 1, height: 1, background: B.border }} />
        </div>

        {/* Desapego */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: B.muted, background: B.mutedBg, padding: "2px 10px", borderRadius: 999 }}>Entre vizinhos</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Repeat size={16} color={B.primary} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: B.dark, margin: 0 }}>Desapego</h2>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button style={{ color: B.muted, background: "none", border: "none", cursor: "pointer" }}><Info size={14} /></button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" style={{ maxWidth: 200, fontSize: 12 }}>Itens usados à venda ou doação entre moradores do condomínio.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <button onClick={() => navigate("/morador/desapegos")} style={{ fontSize: 11, fontWeight: 600, color: B.primary, textTransform: "uppercase", letterSpacing: 0.5, background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => scrollCarousel(desapegoRef, "left")} style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10, height: 32, width: 32, borderRadius: "50%", background: B.card, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <ChevronLeft size={16} color={B.dark} />
            </button>
            <div ref={desapegoRef} style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 4px 8px", scrollbarWidth: "none" as any }}>
              {(desapegos.length > 0 ? desapegos : [
                { id: "mock-1", titulo: "Bicicleta Aro 29", preco: 450, status: "ativo" },
                { id: "mock-2", titulo: "Sofá 3 Lugares", preco: 800, status: "ativo" },
                { id: "mock-3", titulo: "Livros Diversos", preco: 5, status: "ativo" },
                { id: "mock-4", titulo: "Carrinho de Bebê", preco: 350, status: "ativo" },
              ]).map((item: any, idx: number) => (
                <button key={item.id} onClick={() => item.id.startsWith("mock") ? navigate("/morador/desapegos") : navigate(`/morador/desapegos/${item.id}`)} style={{ flexShrink: 0, width: 140, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ borderRadius: 20, overflow: "hidden", background: B.card, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div style={{ height: 100, overflow: "hidden" }}>
                      <img src={fallbackDesapegoImages[idx % fallbackDesapegoImages.length]} alt={item.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: 12 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: B.primary, textTransform: "uppercase" }}>Desapego</span>
                      <p style={{ fontSize: 13, fontWeight: 500, color: B.dark, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.titulo}</p>
                      {item.preco != null && <p style={{ fontSize: 13, fontWeight: 700, color: B.primary, margin: "4px 0 0" }}>R$ {Number(item.preco).toFixed(2).replace(".", ",")}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => scrollCarousel(desapegoRef, "right")} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10, height: 32, width: 32, borderRadius: "50%", background: B.card, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <ChevronRight size={16} color={B.dark} />
            </button>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
};

export default PreviewHome;

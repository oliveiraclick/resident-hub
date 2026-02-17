import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, ShoppingBag, ChevronLeft, ChevronRight, Repeat, Info, MapPin,
  Home, Search, Bell, User, Wrench, QrCode,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCategorias } from "@/hooks/useCategorias";
import { getIcon } from "@/lib/iconMap";
import logoMorador from "@/assets/logo-morador.png";

import productBolo from "@/assets/product-bolo.jpg";
import productSabonete from "@/assets/product-sabonete.jpg";
import productBrigadeiro from "@/assets/product-brigadeiro.jpg";
import productVela from "@/assets/product-vela.jpg";
import desapegoBike from "@/assets/desapego-bike.jpg";
import desapegoSofa from "@/assets/desapego-sofa.jpg";
import desapegoLivros from "@/assets/desapego-livros.jpg";
import desapegoCarrinho from "@/assets/desapego-carrinho.jpg";

const fallbackShopImages = [productBolo, productSabonete, productBrigadeiro, productVela];
const fallbackDesapegoImages = [desapegoBike, desapegoSofa, desapegoLivros, desapegoCarrinho];

const T = {
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  gradientFrom: "#3B82F6",
  gradientTo: "#06B6D4",
  headerDark: "#0B0F2F",
  white: "#FFFFFF",
  bg: "#F3F4F6",
  cardBg: "#FFFFFF",
  borderLight: "#E5E7EB",
  textDark: "#111827",
  textBody: "#374151",
  textMuted: "#9CA3AF",
  textSecondary: "#6B7280",
  success: "#10B981",
  primary8: "rgba(37,99,235,0.08)",
  primary12: "rgba(37,99,235,0.12)",
  primary20: "rgba(37,99,235,0.20)",
  shadowCard: "0 2px 8px rgba(0,0,0,0.05)",
  shadowElevated: "0 8px 24px rgba(0,0,0,0.08)",
  shadowCta: "0 4px 10px rgba(37,99,235,0.3)",
};

const PreviewHome3 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categorias: allCategorias } = useCategorias();

  const [profileName, setProfileName] = useState<string | null>(null);
  const [condominioName, setCondominioName] = useState<string | null>(null);
  const [condominioLogo, setCondominioLogo] = useState<string | null>(null);
  const [aprovado, setAprovado] = useState(true);
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

    const fetchProfile = async () => {
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

    fetchProfile(); fetchPending(); fetchProdutos(); fetchDesapegos(); fetchBanners(); fetchAvisos(); fetchPrestadoresVisiveis();
  }, [user]);

  const userName = profileName || (user?.user_metadata?.nome as string) || "Morador";

  return (
    <div style={{ background: T.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ═══ HEADER ═══ */}
      <div style={{
        background: T.headerDark,
        borderRadius: "0 0 20px 20px",
        padding: "48px 16px 28px",
        color: T.white,
      }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {condominioLogo ? (
              <img src={condominioLogo} alt={condominioName || "Condomínio"} style={{ height: 34, width: 34, borderRadius: 8, objectFit: "cover" }} />
            ) : (
              <img src={logoMorador} alt="Morador.app" style={{ height: 34, width: 34, objectFit: "contain" }} />
            )}
            <span style={{ fontWeight: 500, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
              {condominioName || "Morador.app"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => navigate("/morador/qr-id")} style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
              <QrCode size={18} color="rgba(255,255,255,0.8)" />
            </button>
            <button style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
              <Bell size={18} color="rgba(255,255,255,0.8)" />
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 400, letterSpacing: 0.3 }}>Bem-vindo de volta</p>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "4px 0 0", lineHeight: 1.2, color: T.white }}>{userName} 👋</h1>
        </div>

        {/* Search */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "11px 16px",
          display: "flex", alignItems: "center", gap: 10,
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <Search size={16} color="rgba(255,255,255,0.4)" />
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>Buscar prestadores, serviços...</span>
        </div>
      </div>

      {/* Pending approval */}
      {!aprovado && (
        <div style={{ margin: "16px 16px 0", borderRadius: 12, background: T.cardBg, border: `1px solid ${T.borderLight}`, padding: "12px 16px", boxShadow: T.shadowCard }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: T.textDark, margin: 0 }}>⏳ Cadastro em análise</p>
          <p style={{ fontSize: 12, color: T.textMuted, margin: "4px 0 0" }}>Seu acesso está pendente de aprovação.</p>
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: "24px 16px 100px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Serviços */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: T.textDark, margin: 0 }}>Serviços</h2>
            <button onClick={() => navigate("/morador/servicos/categorias")} style={{ fontSize: 14, fontWeight: 500, color: T.primary, background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {allCategorias.slice(0, 4).map((item) => {
              const Icon = getIcon(item.icone);
              return (
                <button key={item.id} onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(item.nome)}`)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ height: 52, width: 52, borderRadius: 16, background: T.primary8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={22} color={T.primary} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 400, color: T.textBody, textAlign: "center", lineHeight: 1.3 }}>{item.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prestadores no condomínio */}
        {prestadoresVisiveis.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <MapPin size={16} color={T.primary} />
              <h2 style={{ fontSize: 18, fontWeight: 500, color: T.textDark, margin: 0 }}>No condomínio agora</h2>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
              {prestadoresVisiveis.map((p) => {
                const mins = Math.max(0, Math.ceil((new Date(p.visivel_ate).getTime() - Date.now()) / 60000));
                return (
                  <button key={p.id} onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(p.especialidade)}`)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, borderRadius: 16, background: T.cardBg, border: `1px solid ${T.borderLight}`, padding: "14px 16px", cursor: "pointer", boxShadow: T.shadowCard }}>
                    <div style={{ height: 44, width: 44, borderRadius: "50%", background: T.primary8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 600, color: T.primary }}>{p.nome?.charAt(0)?.toUpperCase() || "P"}</div>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: T.textDark, margin: 0, lineHeight: 1.4 }}>{p.nome}</p>
                      <p style={{ fontSize: 12, color: T.primary, fontWeight: 500, margin: "2px 0 0" }}>{p.especialidade}</p>
                      <p style={{ fontSize: 12, color: T.textMuted, margin: "2px 0 0" }}>Disponível por {mins} min</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Encomendas pendentes */}
        {pendingCount > 0 && (
          <button onClick={() => navigate("/morador/encomendas")} style={{
            borderRadius: 16, background: `linear-gradient(135deg, ${T.gradientFrom}, ${T.gradientTo})`, padding: 16, display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "left", border: "none", cursor: "pointer", boxShadow: T.shadowCta,
          }}>
            <div style={{ height: 48, width: 48, borderRadius: 12, background: "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={24} color={T.white} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.white, margin: 0 }}>Você tem {pendingCount} encomenda{pendingCount > 1 ? "s" : ""}!</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "4px 0 0" }}>Confira suas entregas pendentes</p>
            </div>
          </button>
        )}

        {/* Banners */}
        {banners.length > 0 && (
          <div onClick={() => { const link = banners[bannerIdx]?.link; if (link) window.open(link, "_blank"); }} style={{ borderRadius: 16, overflow: "hidden", position: "relative", height: 170, cursor: "pointer", boxShadow: T.shadowElevated }}>
            {banners[bannerIdx]?.imagem_url ? (
              <img src={banners[bannerIdx].imagem_url} alt={banners[bannerIdx].titulo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: T.primary20 }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", padding: 16 }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: T.white, margin: 0, lineHeight: 1.25 }}>{banners[bannerIdx]?.titulo}</p>
              {banners[bannerIdx]?.subtitulo && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "4px 0 0", fontWeight: 400 }}>{banners[bannerIdx].subtitulo}</p>}
            </div>
            {banners.length > 1 && (
              <div style={{ position: "absolute", bottom: 10, right: 14, zIndex: 1, display: "flex", gap: 6 }}>
                {banners.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }} style={{
                    width: i === bannerIdx ? 20 : 6, height: 6,
                    borderRadius: 3,
                    background: i === bannerIdx ? T.white : "rgba(255,255,255,0.35)",
                    border: "none", cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* News ticker */}
        {avisos.length > 0 && (
          <div style={{ borderRadius: 12, background: T.headerDark, padding: "10px 16px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: T.primary, textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0, background: T.primary12, padding: "3px 10px", borderRadius: 6 }}>News</span>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p style={{ whiteSpace: "nowrap", animation: "ticker 18s linear infinite", fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.75)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  {avisos.map((a: any, i: number) => (
                    <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {i > 0 && <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.3)", margin: "0 10px", flexShrink: 0 }} />}
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
            <span style={{ fontSize: 12, fontWeight: 400, color: T.textMuted }}>De prestadores</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingBag size={18} color={T.primary} />
              <h2 style={{ fontSize: 18, fontWeight: 500, color: T.textDark, margin: 0 }}>Vitrine E-shop</h2>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button style={{ color: T.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}><Info size={14} /></button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" style={{ maxWidth: 200, fontSize: 12 }}>Produtos e serviços oferecidos por prestadores cadastrados na plataforma.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <button onClick={() => navigate("/morador/produtos")} style={{ fontSize: 14, fontWeight: 500, color: T.primary, background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => scrollCarousel(shopRef, "left")} style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10, height: 36, width: 36, borderRadius: 12, background: T.cardBg, boxShadow: T.shadowCard, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.borderLight}`, cursor: "pointer" }}>
              <ChevronLeft size={16} color={T.textSecondary} />
            </button>
            <div ref={shopRef} style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 4px 8px" }}>
              {(produtos.length > 0 ? produtos : [
                { id: "mock-1", titulo: "Bolo Caseiro", preco: 25, status: "ativo" },
                { id: "mock-2", titulo: "Sabonete Artesanal", preco: 12, status: "ativo" },
                { id: "mock-3", titulo: "Brigadeiro Gourmet", preco: 3.5, status: "ativo" },
                { id: "mock-4", titulo: "Vela Aromática", preco: 18, status: "ativo" },
              ]).map((product: any, idx: number) => (
                <button key={product.id} onClick={() => product.id.startsWith("mock") ? navigate("/morador/produtos") : navigate(`/morador/produtos/${product.id}`)} style={{ flexShrink: 0, width: 155, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ borderRadius: 16, overflow: "hidden", background: T.cardBg, boxShadow: T.shadowCard, border: `1px solid ${T.borderLight}` }}>
                    <div style={{ height: 115, overflow: "hidden" }}>
                      <img src={fallbackShopImages[idx % fallbackShopImages.length]} alt={product.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "12px 12px 14px" }}>
                      <span style={{ fontSize: 10, fontWeight: 500, color: T.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>Loja</span>
                      <p style={{ fontSize: 14, fontWeight: 500, color: T.textBody, margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>{product.titulo}</p>
                      {product.preco != null && <p style={{ fontSize: 16, fontWeight: 600, color: T.primary, margin: "6px 0 0" }}>R$ {Number(product.preco).toFixed(2).replace(".", ",")}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => scrollCarousel(shopRef, "right")} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10, height: 36, width: 36, borderRadius: 12, background: T.cardBg, boxShadow: T.shadowCard, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.borderLight}`, cursor: "pointer" }}>
              <ChevronRight size={16} color={T.textSecondary} />
            </button>
          </div>
        </div>

        {/* Separador */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, height: 1, background: T.borderLight }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.primary12 }} />
          <div style={{ flex: 1, height: 1, background: T.borderLight }} />
        </div>

        {/* Desapego */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 400, color: T.textMuted }}>Entre vizinhos</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Repeat size={18} color={T.primary} />
              <h2 style={{ fontSize: 18, fontWeight: 500, color: T.textDark, margin: 0 }}>Desapego</h2>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button style={{ color: T.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}><Info size={14} /></button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" style={{ maxWidth: 200, fontSize: 12 }}>Itens usados à venda ou doação entre moradores do condomínio.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <button onClick={() => navigate("/morador/desapegos")} style={{ fontSize: 14, fontWeight: 500, color: T.primary, background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => scrollCarousel(desapegoRef, "left")} style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10, height: 36, width: 36, borderRadius: 12, background: T.cardBg, boxShadow: T.shadowCard, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.borderLight}`, cursor: "pointer" }}>
              <ChevronLeft size={16} color={T.textSecondary} />
            </button>
            <div ref={desapegoRef} style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 4px 8px" }}>
              {(desapegos.length > 0 ? desapegos : [
                { id: "mock-1", titulo: "Bicicleta Aro 29", preco: 450, status: "ativo" },
                { id: "mock-2", titulo: "Sofá 3 Lugares", preco: 800, status: "ativo" },
                { id: "mock-3", titulo: "Livros Diversos", preco: 5, status: "ativo" },
                { id: "mock-4", titulo: "Carrinho de Bebê", preco: 350, status: "ativo" },
              ]).map((item: any, idx: number) => (
                <button key={item.id} onClick={() => item.id.startsWith("mock") ? navigate("/morador/desapegos") : navigate(`/morador/desapegos/${item.id}`)} style={{ flexShrink: 0, width: 155, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ borderRadius: 16, overflow: "hidden", background: T.cardBg, boxShadow: T.shadowCard, border: `1px solid ${T.borderLight}` }}>
                    <div style={{ height: 115, overflow: "hidden" }}>
                      <img src={fallbackDesapegoImages[idx % fallbackDesapegoImages.length]} alt={item.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "12px 12px 14px" }}>
                      <span style={{ fontSize: 10, fontWeight: 500, color: T.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>Desapego</span>
                      <p style={{ fontSize: 14, fontWeight: 500, color: T.textBody, margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>{item.titulo}</p>
                      {item.preco != null && <p style={{ fontSize: 16, fontWeight: 600, color: T.primary, margin: "6px 0 0" }}>R$ {Number(item.preco).toFixed(2).replace(".", ",")}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => scrollCarousel(desapegoRef, "right")} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10, height: 36, width: 36, borderRadius: 12, background: T.cardBg, boxShadow: T.shadowCard, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.borderLight}`, cursor: "pointer" }}>
              <ChevronRight size={16} color={T.textSecondary} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: T.white, borderTop: `1px solid ${T.borderLight}`,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        height: 64, zIndex: 50,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.04)",
      }}>
        {[
          { icon: Home, label: "Início", active: true, path: "/preview-home3" },
          { icon: Wrench, label: "Serviços", active: false, path: "/morador/servicos" },
          { icon: ShoppingBag, label: "Shop", active: false, path: "/morador/produtos" },
          { icon: Package, label: "Encomendas", active: false, path: "/morador/encomendas" },
          { icon: User, label: "Perfil", active: false, path: "/morador/perfil" },
        ].map((item) => (
          <button key={item.label} onClick={() => navigate(item.path)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "8px 12px" }}>
            <item.icon size={24} color={item.active ? T.primary : T.textMuted} strokeWidth={item.active ? 2.2 : 2} />
            <span style={{ fontSize: 10, fontWeight: item.active ? 600 : 400, color: item.active ? T.primary : T.textMuted }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PreviewHome3;

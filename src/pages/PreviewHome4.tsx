import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, ShoppingBag, Repeat, Info, MapPin,
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

/* ── Emerald & Charcoal palette ── */
const V = {
  primary: "#059669",
  primaryLight: "#10B981",
  primarySoft: "rgba(5,150,105,0.08)",
  primaryBorder: "rgba(5,150,105,0.15)",
  primary15: "rgba(5,150,105,0.15)",
  gradientFrom: "#059669",
  gradientTo: "#0D9488",
  headerDark: "#111827",
  headerMid: "#1F2937",
  white: "#FFFFFF",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  textDark: "#111827",
  textBody: "#374151",
  textMuted: "#9CA3AF",
  textSecondary: "#6B7280",
  amber: "#F59E0B",
  shadowCard: "0 1px 6px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.06)",
};

const PreviewHome4 = () => {
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

  const hideScrollbar: React.CSSProperties = { scrollbarWidth: "none", msOverflowStyle: "none" };

  const productList = produtos.length > 0 ? produtos : [
    { id: "mock-1", titulo: "Bolo Caseiro", preco: 25, status: "ativo" },
    { id: "mock-2", titulo: "Sabonete Artesanal", preco: 12, status: "ativo" },
    { id: "mock-3", titulo: "Brigadeiro Gourmet", preco: 3.5, status: "ativo" },
    { id: "mock-4", titulo: "Vela Aromática", preco: 18, status: "ativo" },
  ];

  const desapegoList = desapegos.length > 0 ? desapegos : [
    { id: "mock-1", titulo: "Bicicleta Aro 29", preco: 450, status: "ativo" },
    { id: "mock-2", titulo: "Sofá 3 Lugares", preco: 800, status: "ativo" },
    { id: "mock-3", titulo: "Livros Diversos", preco: 5, status: "ativo" },
    { id: "mock-4", titulo: "Carrinho de Bebê", preco: 350, status: "ativo" },
  ];

  return (
    <div style={{ background: V.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: "Inter, -apple-system, sans-serif" }}>

      {/* ═══ HEADER ═══ */}
      <div style={{
        background: `linear-gradient(160deg, ${V.headerDark} 0%, ${V.headerMid} 60%, ${V.primary} 100%)`,
        borderRadius: "0 0 28px 28px",
        padding: "48px 20px 28px",
        color: V.white,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(5,150,105,0.12)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(5,150,105,0.08)" }} />

        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {condominioLogo ? (
              <img src={condominioLogo} alt={condominioName || "Condomínio"} style={{ height: 36, width: 36, borderRadius: 10, objectFit: "cover", border: "2px solid rgba(255,255,255,0.15)" }} />
            ) : (
              <img src={logoMorador} alt="Morador.app" style={{ height: 36, width: 36, objectFit: "contain" }} />
            )}
            <span style={{ fontWeight: 600, fontSize: 15, color: "rgba(255,255,255,0.9)" }}>
              {condominioName || "Morador.app"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => navigate("/morador/qr-id")} style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.10)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
              <QrCode size={18} color="rgba(255,255,255,0.85)" />
            </button>
            <button style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.10)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
              <Bell size={18} color="rgba(255,255,255,0.85)" />
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: 20, position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 13, color: V.primaryLight, margin: 0, fontWeight: 500 }}>Olá,</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "2px 0 0", lineHeight: 1.15 }}>{userName} 👋</h1>
        </div>

        {/* Search */}
        <div style={{
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(12px)",
          borderRadius: 14, padding: "13px 16px",
          display: "flex", alignItems: "center", gap: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          position: "relative", zIndex: 1,
        }}>
          <Search size={16} color="rgba(255,255,255,0.5)" />
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Buscar prestadores, serviços...</span>
        </div>
      </div>

      {/* Pending approval */}
      {!aprovado && (
        <div style={{ margin: "16px 16px 0", borderRadius: 14, background: V.card, border: `1px solid ${V.border}`, padding: "14px 16px", boxShadow: V.shadowCard }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: V.textDark, margin: 0 }}>⏳ Cadastro em análise</p>
          <p style={{ fontSize: 13, color: V.textMuted, margin: "4px 0 0" }}>Seu acesso está pendente de aprovação.</p>
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: "24px 16px 100px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Serviços */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: V.textDark, margin: 0 }}>Serviços</h2>
            <button onClick={() => navigate("/morador/servicos/categorias")} style={{ fontSize: 13, fontWeight: 600, color: V.primary, background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {allCategorias.slice(0, 4).map((item) => {
              const Icon = getIcon(item.icone);
              return (
                <button key={item.id} onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(item.nome)}`)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ height: 56, width: 56, borderRadius: 18, background: V.primarySoft, border: `1px solid ${V.primaryBorder}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}>
                    <Icon size={22} color={V.primary} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: V.textBody, textAlign: "center", lineHeight: 1.3 }}>{item.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prestadores no condomínio */}
        {prestadoresVisiveis.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: V.primarySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={14} color={V.primary} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: V.textDark, margin: 0 }}>No condomínio agora</h2>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, ...hideScrollbar }}>
              {prestadoresVisiveis.map((p) => {
                const mins = Math.max(0, Math.ceil((new Date(p.visivel_ate).getTime() - Date.now()) / 60000));
                return (
                  <button key={p.id} onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(p.especialidade)}`)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, borderRadius: 16, background: V.card, border: `1px solid ${V.border}`, padding: "14px 16px", cursor: "pointer", boxShadow: V.shadowCard }}>
                    <div style={{ height: 46, width: 46, borderRadius: "50%", background: `linear-gradient(135deg, ${V.gradientFrom}, ${V.gradientTo})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: V.white }}>{p.nome?.charAt(0)?.toUpperCase() || "P"}</div>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: V.textDark, margin: 0 }}>{p.nome}</p>
                      <p style={{ fontSize: 12, color: V.primary, fontWeight: 500, margin: "2px 0" }}>{p.especialidade}</p>
                      <p style={{ fontSize: 11, color: V.textMuted, margin: 0 }}>Disponível por {mins} min</p>
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
            borderRadius: 18, background: V.card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "left", border: `1.5px solid ${V.primary}`, cursor: "pointer", boxShadow: V.shadowCard,
          }}>
            <div style={{ height: 50, width: 50, borderRadius: 14, background: `linear-gradient(135deg, ${V.gradientFrom}, ${V.gradientTo})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={24} color={V.white} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: V.textDark, margin: 0 }}>Você tem {pendingCount} encomenda{pendingCount > 1 ? "s" : ""}!</p>
              <p style={{ fontSize: 13, color: V.textMuted, margin: "4px 0 0" }}>Confira suas entregas pendentes</p>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: V.primary, flexShrink: 0, animation: "pulse 2s infinite" }} />
          </button>
        )}

        {/* Banners */}
        {banners.length > 0 && (
          <div onClick={() => { const link = banners[bannerIdx]?.link; if (link) window.open(link, "_blank"); }} style={{ borderRadius: 20, overflow: "hidden", position: "relative", height: 175, cursor: "pointer", boxShadow: V.shadowMd }}>
            {banners[bannerIdx]?.imagem_url ? (
              <img src={banners[bannerIdx].imagem_url} alt={banners[bannerIdx].titulo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${V.headerDark}, ${V.primary})` }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, transparent)" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", padding: 18 }}>
              <p style={{ fontSize: 19, fontWeight: 700, color: V.white, margin: 0, lineHeight: 1.2 }}>{banners[bannerIdx]?.titulo}</p>
              {banners[bannerIdx]?.subtitulo && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "6px 0 0" }}>{banners[bannerIdx].subtitulo}</p>}
            </div>
            {banners.length > 1 && (
              <div style={{ position: "absolute", bottom: 12, right: 16, zIndex: 1, display: "flex", gap: 6 }}>
                {banners.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }} style={{
                    width: i === bannerIdx ? 22 : 8, height: 8,
                    borderRadius: 4,
                    background: i === bannerIdx ? V.primaryLight : "rgba(255,255,255,0.35)",
                    border: "none", cursor: "pointer", transition: "all 0.2s ease",
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* News ticker */}
        {avisos.length > 0 && (
          <div style={{ borderRadius: 14, background: `linear-gradient(90deg, ${V.headerDark}, ${V.headerMid})`, padding: "11px 16px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: V.primaryLight, textTransform: "uppercase", letterSpacing: 1, flexShrink: 0, background: "rgba(16,185,129,0.12)", padding: "4px 10px", borderRadius: 6 }}>News</span>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p style={{ whiteSpace: "nowrap", animation: "ticker 18s linear infinite", fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.7)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  {avisos.map((a: any, i: number) => (
                    <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {i > 0 && <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: V.primaryLight, margin: "0 10px", flexShrink: 0, opacity: 0.5 }} />}
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
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: V.textMuted, letterSpacing: 0.3 }}>De prestadores</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingBag size={18} color={V.primary} />
              <h2 style={{ fontSize: 18, fontWeight: 600, color: V.textDark, margin: 0 }}>Vitrine E-shop</h2>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button style={{ color: V.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}><Info size={14} /></button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" style={{ maxWidth: 200, fontSize: 12 }}>Produtos e serviços oferecidos por prestadores cadastrados na plataforma.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <button onClick={() => navigate("/morador/produtos")} style={{ fontSize: 13, fontWeight: 600, color: V.primary, background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, ...hideScrollbar }}>
            {productList.map((product: any, idx: number) => (
              <button key={product.id} onClick={() => product.id.startsWith("mock") ? navigate("/morador/produtos") : navigate(`/morador/produtos/${product.id}`)} style={{ flexShrink: 0, width: 155, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <div style={{ borderRadius: 18, overflow: "hidden", background: V.card, boxShadow: V.shadowCard, border: `1px solid ${V.border}` }}>
                  <div style={{ height: 120, overflow: "hidden", position: "relative" }}>
                    <img src={fallbackShopImages[idx % fallbackShopImages.length]} alt={product.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 600, color: V.white, background: V.primary, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Loja</span>
                  </div>
                  <div style={{ padding: "12px 14px 14px" }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: V.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>{product.titulo}</p>
                    {product.preco != null && <p style={{ fontSize: 16, fontWeight: 700, color: V.primary, margin: "6px 0 0" }}>R$ {Number(product.preco).toFixed(2).replace(".", ",")}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Separador */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px" }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${V.border})` }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: V.primary15 }} />
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${V.border})` }} />
        </div>

        {/* Desapego */}
        <div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: V.textMuted, letterSpacing: 0.3 }}>Entre vizinhos</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Repeat size={18} color={V.primary} />
              <h2 style={{ fontSize: 18, fontWeight: 600, color: V.textDark, margin: 0 }}>Desapego</h2>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button style={{ color: V.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}><Info size={14} /></button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" style={{ maxWidth: 200, fontSize: 12 }}>Itens usados à venda ou doação entre moradores do condomínio.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <button onClick={() => navigate("/morador/desapegos")} style={{ fontSize: 13, fontWeight: 600, color: V.primary, background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, ...hideScrollbar }}>
            {desapegoList.map((item: any, idx: number) => (
              <button key={item.id} onClick={() => item.id.startsWith("mock") ? navigate("/morador/desapegos") : navigate(`/morador/desapegos/${item.id}`)} style={{ flexShrink: 0, width: 155, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <div style={{ borderRadius: 18, overflow: "hidden", background: V.card, boxShadow: V.shadowCard, border: `1px solid ${V.border}` }}>
                  <div style={{ height: 120, overflow: "hidden", position: "relative" }}>
                    <img src={fallbackDesapegoImages[idx % fallbackDesapegoImages.length]} alt={item.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 600, color: V.white, background: V.amber, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Desapego</span>
                  </div>
                  <div style={{ padding: "12px 14px 14px" }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: V.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>{item.titulo}</p>
                    {item.preco != null && <p style={{ fontSize: 16, fontWeight: 700, color: V.primary, margin: "6px 0 0" }}>R$ {Number(item.preco).toFixed(2).replace(".", ",")}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: V.white,
        borderTop: `1px solid ${V.border}`,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        height: 68, zIndex: 50,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.04)",
      }}>
        {[
          { icon: Home, label: "Início", active: true, path: "/preview-home4" },
          { icon: Wrench, label: "Serviços", active: false, path: "/morador/servicos" },
          { icon: ShoppingBag, label: "Shop", active: false, path: "/morador/produtos" },
          { icon: Package, label: "Encomendas", active: false, path: "/morador/encomendas" },
          { icon: User, label: "Perfil", active: false, path: "/morador/perfil" },
        ].map((item) => (
          <button key={item.label} onClick={() => navigate(item.path)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 14px", position: "relative" }}>
            {item.active && <div style={{ position: "absolute", top: -1, width: 24, height: 3, borderRadius: 2, background: V.primary }} />}
            <item.icon size={22} color={item.active ? V.primary : V.textMuted} strokeWidth={item.active ? 2.3 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: item.active ? 600 : 400, color: item.active ? V.primary : V.textMuted }}>{item.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
};

export default PreviewHome4;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, ShoppingBag, Repeat, MapPin,
  Home, Search, Bell, User, Wrench, QrCode, ArrowRight, Sparkles,
} from "lucide-react";
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

const X = {
  accent: "#FF5722",
  accentLight: "#FF8A65",
  accentDark: "#E64A19",
  accentSoft: "rgba(255,87,34,0.07)",
  accentBorder: "rgba(255,87,34,0.15)",
  accentGlow: "rgba(255,87,34,0.25)",
  headerBg: "#1A1A2E",
  headerMid: "#16213E",
  headerAccent: "#0F3460",
  white: "#FFFFFF",
  bg: "#FAFAFA",
  card: "#FFFFFF",
  border: "#F0F0F0",
  textDark: "#1A1A2E",
  textBody: "#4A4A68",
  textMuted: "#9E9EB8",
  amber: "#FFB300",
};

const hs: React.CSSProperties = { scrollbarWidth: "none", msOverflowStyle: "none" };

const PreviewHome5 = () => {
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
  const firstName = userName.split(" ")[0];

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
    <div style={{ background: X.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: "Inter, -apple-system, sans-serif", position: "relative" }}>

      {/* ═══ HERO HEADER ═══ */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {/* Background with wave */}
        <div style={{
          background: `linear-gradient(145deg, ${X.headerBg} 0%, ${X.headerMid} 40%, ${X.accent} 100%)`,
          padding: "48px 20px 80px",
          color: X.white,
        }}>
          {/* Decorative blobs */}
          <div style={{ position: "absolute", top: 20, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,87,34,0.15)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: 40, left: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,87,34,0.1)", filter: "blur(30px)" }} />

          {/* Top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {condominioLogo ? (
                <img src={condominioLogo} alt={condominioName || ""} style={{ height: 38, width: 38, borderRadius: 12, objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)" }} />
              ) : (
                <img src={logoMorador} alt="Morador.app" style={{ height: 38, width: 38, objectFit: "contain" }} />
              )}
              <div>
                <span style={{ fontWeight: 700, fontSize: 16, display: "block", lineHeight: 1.1 }}>
                  {condominioName || "Morador.app"}
                </span>
                <span style={{ fontSize: 10, color: X.accentLight, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>Seu condomínio digital</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => navigate("/morador/qr-id")} style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                <QrCode size={20} color={X.white} />
              </button>
              <button style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", position: "relative" }}>
                <Bell size={20} color={X.white} />
              </button>
            </div>
          </div>

          {/* Big greeting */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <p style={{ fontSize: 14, color: X.accentLight, margin: 0, fontWeight: 500 }}>Bem-vindo de volta,</p>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: "4px 0 0", lineHeight: 1.1, letterSpacing: -0.5 }}>{firstName} <span style={{ fontSize: 28 }}>🔥</span></h1>
          </div>
        </div>

        {/* Wave cutout */}
        <svg viewBox="0 0 430 40" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", display: "block" }}>
          <path d="M0,20 Q107,45 215,20 Q323,-5 430,20 L430,40 L0,40 Z" fill={X.bg} />
        </svg>
      </div>

      {/* Search bar - floating overlap */}
      <div style={{ padding: "0 20px", marginTop: -28, position: "relative", zIndex: 10 }}>
        <div style={{
          background: X.card, borderRadius: 16, padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)", border: `1px solid ${X.border}`,
        }}>
          <Search size={18} color={X.accent} />
          <span style={{ fontSize: 14, color: X.textMuted, fontWeight: 400 }}>Buscar prestadores, serviços...</span>
        </div>
      </div>

      {/* Pending approval */}
      {!aprovado && (
        <div style={{ margin: "16px 20px 0", borderRadius: 16, background: X.card, border: `1px solid ${X.border}`, padding: "14px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: X.textDark, margin: 0 }}>⏳ Cadastro em análise</p>
          <p style={{ fontSize: 13, color: X.textMuted, margin: "4px 0 0" }}>Seu acesso está pendente de aprovação.</p>
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: "20px 20px 110px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Serviços - chips style */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: X.accent }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: X.textDark, margin: 0 }}>Serviços</h2>
            </div>
            <button onClick={() => navigate("/morador/servicos/categorias")} style={{ fontSize: 13, fontWeight: 600, color: X.accent, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              Ver tudo <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {allCategorias.slice(0, 4).map((item) => {
              const Icon = getIcon(item.icone);
              return (
                <button key={item.id} onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(item.nome)}`)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: X.card, border: `1px solid ${X.border}`,
                  borderRadius: 14, padding: "12px 16px",
                  cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  flex: "1 1 calc(50% - 5px)", minWidth: 0,
                }}>
                  <div style={{ height: 40, width: 40, borderRadius: 12, background: X.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={20} color={X.accent} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: X.textDark, textAlign: "left", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prestadores no condomínio */}
        {prestadoresVisiveis.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: X.accent }} />
              <MapPin size={16} color={X.accent} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: X.textDark, margin: 0 }}>No condomínio agora</h2>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, ...hs }}>
              {prestadoresVisiveis.map((p) => {
                const mins = Math.max(0, Math.ceil((new Date(p.visivel_ate).getTime() - Date.now()) / 60000));
                return (
                  <button key={p.id} onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(p.especialidade)}`)} style={{ flexShrink: 0, borderRadius: 18, background: X.card, border: `1px solid ${X.border}`, padding: "16px 18px", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", textAlign: "left", minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ height: 48, width: 48, borderRadius: 16, background: `linear-gradient(135deg, ${X.accent}, ${X.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: X.white }}>{p.nome?.charAt(0)?.toUpperCase() || "P"}</div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: X.textDark, margin: 0 }}>{p.nome}</p>
                        <p style={{ fontSize: 12, color: X.accent, fontWeight: 600, margin: "2px 0 0" }}>{p.especialidade}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "pulse5 1.5s infinite" }} />
                      <p style={{ fontSize: 11, color: X.textMuted, margin: 0, fontWeight: 500 }}>Disponível por {mins} min</p>
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
            borderRadius: 20,
            background: `linear-gradient(135deg, ${X.accent}, ${X.accentDark})`,
            padding: "18px 20px", display: "flex", alignItems: "center", gap: 16,
            width: "100%", textAlign: "left", border: "none", cursor: "pointer",
            boxShadow: `0 8px 24px ${X.accentGlow}`,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            <div style={{ height: 52, width: 52, borderRadius: 16, background: "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backdropFilter: "blur(8px)" }}>
              <Package size={26} color={X.white} />
            </div>
            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: X.white, margin: 0 }}>
                {pendingCount} encomenda{pendingCount > 1 ? "s" : ""} pendente{pendingCount > 1 ? "s" : ""}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "4px 0 0", fontWeight: 400 }}>Toque para conferir →</p>
            </div>
          </button>
        )}

        {/* Banner */}
        {banners.length > 0 && (
          <div onClick={() => { const link = banners[bannerIdx]?.link; if (link) window.open(link, "_blank"); }} style={{ borderRadius: 22, overflow: "hidden", position: "relative", height: 180, cursor: "pointer", boxShadow: "0 6px 24px rgba(0,0,0,0.1)" }}>
            {banners[bannerIdx]?.imagem_url ? (
              <img src={banners[bannerIdx].imagem_url} alt={banners[bannerIdx].titulo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${X.headerBg}, ${X.accent})` }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent)" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", padding: 20 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: X.white, margin: 0, lineHeight: 1.15, letterSpacing: -0.3 }}>{banners[bannerIdx]?.titulo}</p>
              {banners[bannerIdx]?.subtitulo && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "6px 0 0" }}>{banners[bannerIdx].subtitulo}</p>}
            </div>
            {banners.length > 1 && (
              <div style={{ position: "absolute", bottom: 14, right: 18, zIndex: 1, display: "flex", gap: 6 }}>
                {banners.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }} style={{
                    width: i === bannerIdx ? 24 : 8, height: 8, borderRadius: 4,
                    background: i === bannerIdx ? X.accent : "rgba(255,255,255,0.35)",
                    border: "none", cursor: "pointer", transition: "all 0.2s ease",
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* News ticker */}
        {avisos.length > 0 && (
          <div style={{ borderRadius: 16, background: X.headerBg, padding: "12px 16px", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: `linear-gradient(to right, transparent, ${X.headerBg})`, zIndex: 2 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: X.accent, textTransform: "uppercase", letterSpacing: 1.5, flexShrink: 0, background: "rgba(255,87,34,0.15)", padding: "4px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={10} /> News
              </span>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p style={{ whiteSpace: "nowrap", animation: "ticker 18s linear infinite", fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.7)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  {avisos.map((a: any, i: number) => (
                    <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {i > 0 && <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: X.accent, margin: "0 12px", flexShrink: 0, opacity: 0.6 }} />}
                      <span>📢</span><span>{a.texto}</span>
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ VITRINE E-SHOP — 2-column grid ═══ */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: X.accent }} />
              <ShoppingBag size={18} color={X.accent} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: X.textDark, margin: 0 }}>Vitrine E-shop</h2>
            </div>
            <button onClick={() => navigate("/morador/produtos")} style={{ fontSize: 13, fontWeight: 600, color: X.accent, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>Ver tudo <ArrowRight size={14} /></button>
          </div>
          <span style={{ fontSize: 11, color: X.textMuted, fontWeight: 500, marginBottom: 12, display: "block" }}>De prestadores do seu condomínio</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {productList.slice(0, 4).map((product: any, idx: number) => (
              <button key={product.id} onClick={() => product.id.startsWith("mock") ? navigate("/morador/produtos") : navigate(`/morador/produtos/${product.id}`)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
                <div style={{ borderRadius: 20, overflow: "hidden", background: X.card, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: `1px solid ${X.border}` }}>
                  <div style={{ height: 130, overflow: "hidden", position: "relative" }}>
                    <img src={fallbackShopImages[idx % fallbackShopImages.length]} alt={product.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }} />
                  </div>
                  <div style={{ padding: "12px 14px 16px" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: X.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>{product.titulo}</p>
                    {product.preco != null && (
                      <p style={{ fontSize: 18, fontWeight: 800, color: X.accent, margin: "6px 0 0", letterSpacing: -0.3 }}>
                        R$ {Number(product.preco).toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ DESAPEGO — 2-column grid ═══ */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: X.amber }} />
              <Repeat size={18} color={X.amber} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: X.textDark, margin: 0 }}>Desapego</h2>
            </div>
            <button onClick={() => navigate("/morador/desapegos")} style={{ fontSize: 13, fontWeight: 600, color: X.accent, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>Ver tudo <ArrowRight size={14} /></button>
          </div>
          <span style={{ fontSize: 11, color: X.textMuted, fontWeight: 500, marginBottom: 12, display: "block" }}>Entre vizinhos do condomínio</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {desapegoList.slice(0, 4).map((item: any, idx: number) => (
              <button key={item.id} onClick={() => item.id.startsWith("mock") ? navigate("/morador/desapegos") : navigate(`/morador/desapegos/${item.id}`)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
                <div style={{ borderRadius: 20, overflow: "hidden", background: X.card, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: `1px solid ${X.border}` }}>
                  <div style={{ height: 130, overflow: "hidden", position: "relative" }}>
                    <img src={fallbackDesapegoImages[idx % fallbackDesapegoImages.length]} alt={item.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", top: 10, left: 10, fontSize: 9, fontWeight: 700, color: X.white, background: X.amber, padding: "4px 10px", borderRadius: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>Desapego</span>
                  </div>
                  <div style={{ padding: "12px 14px 16px" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: X.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>{item.titulo}</p>
                    {item.preco != null && (
                      <p style={{ fontSize: 18, fontWeight: 800, color: X.accent, margin: "6px 0 0", letterSpacing: -0.3 }}>
                        R$ {Number(item.preco).toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav — pill style */}
      <div style={{
        position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)",
        width: "calc(100% - 40px)", maxWidth: 390,
        background: X.headerBg, borderRadius: 22,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        height: 64, zIndex: 50,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}>
        {[
          { icon: Home, label: "Início", active: true, path: "/preview-home5" },
          { icon: Wrench, label: "Serviços", active: false, path: "/morador/servicos" },
          { icon: ShoppingBag, label: "Shop", active: false, path: "/morador/produtos" },
          { icon: Package, label: "Encomendas", active: false, path: "/morador/encomendas" },
          { icon: User, label: "Perfil", active: false, path: "/morador/perfil" },
        ].map((item) => (
          <button key={item.label} onClick={() => navigate(item.path)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: item.active ? "rgba(255,87,34,0.15)" : "none",
            border: "none", cursor: "pointer",
            padding: "8px 14px", borderRadius: 14,
          }}>
            <item.icon size={20} color={item.active ? X.accent : "rgba(255,255,255,0.45)"} strokeWidth={item.active ? 2.5 : 1.8} />
            <span style={{ fontSize: 9, fontWeight: item.active ? 700 : 400, color: item.active ? X.accent : "rgba(255,255,255,0.45)", letterSpacing: 0.3 }}>{item.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes pulse5 {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
};

export default PreviewHome5;

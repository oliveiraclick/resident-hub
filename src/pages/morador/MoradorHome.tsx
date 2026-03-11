import { useEffect, useState, useRef } from "react";
import { formatBRL } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import {
  Package, ShoppingBag, Repeat, MapPin, ArrowRight, Sparkles, Wrench, UserCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCategorias } from "@/hooks/useCategorias";
import { getIcon } from "@/lib/iconMap";
import MissingPhotoModal from "@/components/MissingPhotoModal";
import EventoConviteFullscreen, { EventoConviteBadge } from "@/components/EventoConviteFullscreen";

import productBolo from "@/assets/product-bolo.jpg";
import productSabonete from "@/assets/product-sabonete.jpg";
import productBrigadeiro from "@/assets/product-brigadeiro.jpg";
import productVela from "@/assets/product-vela.jpg";
import desapegoPlaceholder from "@/assets/desapego-placeholder.png";

const fallbackShopImages = [productBolo, productSabonete, productBrigadeiro, productVela];

const hs: React.CSSProperties = { scrollbarWidth: "none", msOverflowStyle: "none" };

const MoradorHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categorias: allCategorias } = useCategorias();
  const [pendingCount, setPendingCount] = useState(0);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [desapegos, setDesapegos] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<any[]>([]);
  const [prestadoresVisiveis, setPrestadoresVisiveis] = useState<any[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [activeConvitesCount, setActiveConvitesCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchPending = async () => {
      try {
        const { count } = await supabase
          .from("pacotes")
          .select("id", { count: "exact", head: true })
          .eq("morador_id", user.id)
          .in("status", ["RECEBIDO", "AGUARDANDO_RETIRADA", "TRIADO"]);
        setPendingCount(count || 0);
      } catch (e) {
        console.error("fetchPending error", e);
      }
    };

    const fetchProdutos = async () => {
      try {
        const { data } = await supabase
          .from("produtos")
          .select("id, titulo, preco, status, imagem_url, descricao")
          .eq("status", "ativo")
          .gt("preco", 0)
          .not("imagem_url", "is", null)
          .not("descricao", "is", null)
          .order("created_at", { ascending: false })
          .limit(8);
        // Filtro extra: garantir que imagem e descrição não estejam vazios
        setProdutos((data || []).filter(p => p.imagem_url?.trim() && p.descricao?.trim()));
      } catch (e) {
        console.error("fetchProdutos error", e);
      }
    };

    const fetchDesapegos = async () => {
      try {
        const { data } = await supabase
          .from("desapegos")
          .select("id, titulo, preco, status, imagem_url")
          .eq("status", "ativo")
          .order("created_at", { ascending: false })
          .limit(8);
        setDesapegos(data || []);
      } catch (e) {
        console.error("fetchDesapegos error", e);
      }
    };

    const fetchServicos = async () => {
      try {
        const { data } = await supabase
          .from("servicos")
          .select("id, titulo, preco, status")
          .eq("status", "ativo")
          .gt("preco", 0)
          .order("created_at", { ascending: false })
          .limit(8);
        setServicos(data || []);
      } catch (e) {
        console.error("fetchServicos error", e);
      }
    };

    const fetchBanners = async () => {
      try {
        const { data } = await supabase
          .from("banners")
          .select("*")
          .eq("ativo", true)
          .order("ordem", { ascending: true });
        setBanners(data || []);
      } catch (e) {
        console.error("fetchBanners error", e);
      }
    };

    const fetchAvisos = async () => {
      try {
        const { data } = await supabase
          .from("avisos")
          .select("id, texto")
          .eq("ativo", true)
          .order("ordem", { ascending: true });
        setAvisos(data || []);
      } catch (e) {
        console.error("fetchAvisos error", e);
      }
    };

    const fetchPrestadoresVisiveis = async () => {
      try {
        const { data } = await supabase
          .from("prestadores")
          .select("id, user_id, especialidade, visivel_ate")
          .eq("visivel", true)
          .gt("visivel_ate", new Date().toISOString());
        if (data && data.length > 0) {
          const userIds = data.map((p: any) => p.user_id);
          const { data: profiles } = await supabase.rpc("get_prestador_profiles", { _user_ids: userIds });
          const merged = data.map((p: any) => {
            const profile = (profiles || []).find((pr: any) => pr.user_id === p.user_id);
            return { ...p, nome: profile?.nome || "Prestador", avatar_url: profile?.avatar_url };
          });
          setPrestadoresVisiveis(merged);
        } else {
          setPrestadoresVisiveis([]);
        }
      } catch (e) {
        console.error("fetchPrestadoresVisiveis error", e);
      }
    };

    const fetchPendingInvites = async () => {
      try {
        // Busca participações pendentes e filtra apenas eventos ativos
        const { data } = await supabase
          .from("evento_participantes")
          .select("id, evento_id, eventos_amigos!inner(status)")
          .eq("user_id", user.id)
          .eq("status", "pendente")
          .eq("eventos_amigos.status", "ativo");
        setPendingInvitesCount(data?.length || 0);
      } catch (e) {
        console.error("fetchPendingInvites error", e);
      }
    };

    const fetchActiveConvites = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const { count } = await supabase
          .from("convites_visitante")
          .select("id", { count: "exact", head: true })
          .eq("morador_id", user.id)
          .in("status", ["pendente", "registrado"])
          .gte("data_visita", today);
        setActiveConvitesCount(count || 0);
      } catch (e) {
        console.error("fetchActiveConvites error", e);
      }
    };

    fetchPending();
    fetchProdutos();
    fetchServicos();
    fetchDesapegos();
    fetchBanners();
    fetchAvisos();
    fetchPrestadoresVisiveis();
    fetchPendingInvites();
    fetchActiveConvites();
  }, [user]);

  // Auto-rotate banners (robust for iOS WebView)
  useEffect(() => {
    if (banners.length <= 1) return;
    let last = Date.now();
    let raf: number;
    const tick = () => {
      const now = Date.now();
      if (now - last >= 5000) {
        setBannerIdx((prev) => (prev + 1) % banners.length);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [banners.length]);

  // Touch swipe for banners
  const touchStart = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setBannerIdx((prev) => diff > 0 ? (prev + 1) % banners.length : (prev - 1 + banners.length) % banners.length);
    }
  };

  const productList = produtos.length > 0 ? produtos : [
    { id: "mock-1", titulo: "Bolo Caseiro", preco: 25, status: "ativo" },
    { id: "mock-2", titulo: "Sabonete Artesanal", preco: 12, status: "ativo" },
    { id: "mock-3", titulo: "Brigadeiro Gourmet", preco: 3.5, status: "ativo" },
    { id: "mock-4", titulo: "Vela Aromática", preco: 18, status: "ativo" },
  ];

  const desapegoList = desapegos.length > 0
    ? [...desapegos].sort((a, b) => {
        const aImg = !!a.imagem_url;
        const bImg = !!b.imagem_url;
        if (aImg === bImg) return 0;
        return aImg ? -1 : 1;
      })
    : [
    { id: "mock-1", titulo: "Bicicleta Aro 29", preco: 450, status: "ativo" },
    { id: "mock-2", titulo: "Sofá 3 Lugares", preco: 800, status: "ativo" },
    { id: "mock-3", titulo: "Livros Diversos", preco: 5, status: "ativo" },
    { id: "mock-4", titulo: "Carrinho de Bebê", preco: 350, status: "ativo" },
  ];

  return (
    <MoradorLayout title="Início" showSearch>
      <EventoConviteFullscreen />
      <EventoConviteBadge count={pendingInvitesCount} onClick={() => navigate("/morador/entre-amigos")} />
      <MissingPhotoModal />
      <div className="flex flex-col gap-7">

        {/* ═══ BANNER ═══ */}
        {banners.length > 0 && (
          <div
            onClick={() => { const b = banners[bannerIdx]; if (b?.whatsapp) { window.open(`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`, "_blank"); } else if (b?.link) { window.open(b.link, "_blank"); } }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="rounded-[22px] overflow-hidden relative cursor-pointer"
            style={{ height: 180, boxShadow: "0 6px 24px rgba(0,0,0,0.1)" }}
          >
            {banners[bannerIdx]?.imagem_url ? (
              <img src={banners[bannerIdx].imagem_url} alt={banners[bannerIdx].titulo} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, hsl(var(--header-bg)), hsl(var(--primary)))" }} />
            )}
            {banners.length > 1 && (
              <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-[1] flex gap-1.5">
                {banners.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }}
                    className="border-none cursor-pointer transition-all duration-200"
                    style={{
                      width: i === bannerIdx ? 24 : 8, height: 8, borderRadius: 4,
                      background: i === bannerIdx ? "hsl(var(--primary))" : "rgba(255,255,255,0.35)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ NEWS TICKER ═══ */}
        {avisos.length > 0 && (
          <div className="rounded-2xl overflow-hidden relative" style={{ background: "hsl(var(--primary))", padding: "12px 16px" }}>
            <div className="absolute right-0 top-0 bottom-0 w-[60px] z-[2]" style={{ background: `linear-gradient(to right, transparent, hsl(var(--primary)))` }} />
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-extrabold uppercase tracking-widest flex-shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1 text-white" style={{ background: "hsl(var(--header-bg))" }}>
                <Sparkles size={10} /> News
              </span>
              <div className="overflow-hidden flex-1">
                <p className="whitespace-nowrap animate-[ticker_18s_linear_infinite] text-[12px] font-normal text-white m-0 flex items-center gap-1">
                  {avisos.map((a: any, i: number) => (
                    <span key={a.id} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="inline-block w-1 h-1 rounded-full bg-primary/60 mx-3 flex-shrink-0" />}
                      <span>📢</span><span>{a.texto}</span>
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SERVIÇOS ═══ */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-sm bg-primary" />
              <h2 className="text-[20px] font-bold text-foreground m-0">Serviços</h2>
            </div>
            <button onClick={() => navigate("/morador/servicos/categorias")} className="text-[13px] font-semibold text-primary bg-transparent border-none cursor-pointer flex items-center gap-1">
              Ver tudo <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {allCategorias.slice(0, 8).map((item) => {
              const Icon = getIcon(item.icone);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(item.nome)}`)}
                  className="flex items-center gap-2.5 bg-card border border-border rounded-[14px] py-3 px-4 cursor-pointer active:scale-95 transition-transform"
                  style={{ minWidth: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/[0.07] flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <span className="text-[13px] font-medium text-foreground text-left leading-tight truncate">{item.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ PRESTADORES NO CONDOMÍNIO ═══ */}
        {prestadoresVisiveis.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-1 h-5 rounded-sm bg-primary" />
              <MapPin size={16} className="text-primary" />
              <h2 className="text-[20px] font-bold text-foreground m-0">No condomínio agora</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1" style={hs}>
              {prestadoresVisiveis.map((p) => {
                const mins = Math.max(0, Math.ceil((new Date(p.visivel_ate).getTime() - Date.now()) / 60000));
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(p.especialidade)}`)}
                    className="flex-shrink-0 rounded-[18px] bg-card border border-border p-4 cursor-pointer text-left min-w-[200px] active:scale-[0.97] transition-transform"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-[20px] font-extrabold text-white">
                        {p.nome?.charAt(0)?.toUpperCase() || "P"}
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-foreground m-0">{p.nome}</p>
                        <p className="text-[12px] text-primary font-semibold mt-0.5 m-0">{p.especialidade}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <p className="text-[11px] text-muted-foreground m-0 font-medium">Disponível por {mins} min</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ CONVITES ATIVOS ═══ */}
        {activeConvitesCount > 0 && (
          <button
            onClick={() => navigate("/morador/convites")}
            className="w-full text-left border-none cursor-pointer rounded-[20px] flex items-center gap-4 relative overflow-hidden active:scale-[0.98] transition-transform"
            style={{
              background: "linear-gradient(135deg, hsl(var(--info, 210 80% 55%)), hsl(var(--info, 210 80% 45%)))",
              padding: "16px 20px",
              boxShadow: "0 6px 20px hsla(210, 80%, 55%, 0.25)",
            }}
          >
            <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/[0.08]" />
            <div className="h-[48px] w-[48px] rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0" style={{ backdropFilter: "blur(8px)" }}>
              <UserCheck size={24} className="text-white" />
            </div>
            <div className="flex-1 relative z-[1]">
              <p className="text-[15px] font-bold text-white m-0">
                {activeConvitesCount} convite{activeConvitesCount > 1 ? "s" : ""} ativo{activeConvitesCount > 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-white/75 mt-0.5 m-0">Visitantes aguardando →</p>
            </div>
          </button>
        )}

        {/* ═══ ENCOMENDAS PENDENTES ═══ */}
        {pendingCount > 0 && (
          <button
            onClick={() => navigate("/morador/encomendas")}
            className="w-full text-left border-none cursor-pointer rounded-[20px] flex items-center gap-4 relative overflow-hidden active:scale-[0.98] transition-transform"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))",
              padding: "18px 20px",
              boxShadow: "0 8px 24px hsla(var(--primary), 0.25)",
            }}
          >
            <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/[0.08]" />
            <div className="h-[52px] w-[52px] rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0" style={{ backdropFilter: "blur(8px)" }}>
              <Package size={26} className="text-white" />
            </div>
            <div className="flex-1 relative z-[1]">
              <p className="text-[16px] font-bold text-white m-0">
                {pendingCount} encomenda{pendingCount > 1 ? "s" : ""} pendente{pendingCount > 1 ? "s" : ""}
              </p>
              <p className="text-[12px] text-white/75 mt-1 m-0">Toque para conferir →</p>
            </div>
          </button>
        )}

        {/* ═══ VITRINE E-SHOP ═══ */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-sm bg-primary" />
              <ShoppingBag size={18} className="text-primary" />
              <h2 className="text-[20px] font-bold text-foreground m-0">Vitrine E-shop</h2>
            </div>
            <button onClick={() => navigate("/morador/produtos")} className="text-[13px] font-semibold text-primary bg-transparent border-none cursor-pointer flex items-center gap-1">
              Ver tudo <ArrowRight size={14} />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium mb-3">De prestadores do seu condomínio</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {productList.slice(0, 8).map((product: any, idx: number) => (
              <button
                key={product.id}
                onClick={() => product.id.startsWith("mock") ? navigate("/morador/produtos") : navigate(`/morador/produtos/${product.id}`)}
                className="bg-transparent border-none cursor-pointer p-0 text-left active:scale-95 transition-transform"
              >
                <div className="rounded-[20px] overflow-hidden bg-card border border-border" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <div className="h-[130px] overflow-hidden relative">
                    <img src={product.imagem_url || fallbackShopImages[idx % fallbackShopImages.length]} alt={product.titulo} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }} />
                  </div>
                  <div className="p-3 pt-3 pb-4">
                    <p className="text-[14px] font-semibold text-foreground m-0 truncate leading-snug">{product.titulo}</p>
                    {product.preco != null && (
                      <p className="text-[18px] font-extrabold text-primary mt-1.5 m-0 tracking-tight">
                        R$ {formatBRL(product.preco)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ DESAPEGO ═══ */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-sm bg-warning" />
              <Repeat size={18} className="text-warning" />
              <h2 className="text-[20px] font-bold text-foreground m-0">Desapego</h2>
            </div>
            <button onClick={() => navigate("/morador/desapegos")} className="text-[13px] font-semibold text-primary bg-transparent border-none cursor-pointer flex items-center gap-1">
              Ver tudo <ArrowRight size={14} />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium mb-3">Entre vizinhos do condomínio</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {desapegoList.slice(0, 6).map((item: any, idx: number) => (
              <button
                key={item.id}
                onClick={() => item.id.startsWith("mock") ? navigate("/morador/desapegos") : navigate(`/morador/desapegos/${item.id}`)}
                className="bg-transparent border-none cursor-pointer p-0 text-left active:scale-95 transition-transform"
              >
                <div className="rounded-[20px] overflow-hidden bg-card border border-border" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <div className="aspect-[4/5] overflow-hidden relative">
                    {item.imagem_url ? (
                      <img src={item.imagem_url} alt={item.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <img src={desapegoPlaceholder} alt="Sem foto" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-2.5 left-2.5 text-[9px] font-bold text-white bg-warning px-2.5 py-1 rounded-lg uppercase tracking-wider">Desapego</span>
                  </div>
                </div>
                <div className="px-1 pt-1.5 pb-2">
                  <p className="text-[14px] font-semibold text-foreground m-0 truncate leading-snug">{item.titulo}</p>
                  {item.preco != null && (
                    <p className="text-[18px] font-extrabold text-primary mt-1 m-0 tracking-tight">
                      R$ {formatBRL(item.preco)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Atalho discreto para o manual */}
      <div className="px-4 pb-6 pt-2">
        <button
          onClick={() => navigate("/morador/manual")}
          className="w-full text-center text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-2"
        >
          Precisa de ajuda? Toque aqui
        </button>
      </div>
    </MoradorLayout>
  );
};

export default MoradorHome;

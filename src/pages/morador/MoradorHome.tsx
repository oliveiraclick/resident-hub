import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { formatBRL } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import {
  Package, ShoppingBag, Repeat, MapPin, ArrowRight, Sparkles, Wrench, UserCheck, CalendarCheck
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

const ITEMS_PER_PAGE = 10;

const RotatingServicos = ({ categorias, navigate }: { categorias: any[]; navigate: (path: string) => void }) => {
  const shuffled = useMemo(() => {
    const arr = [...categorias];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, ITEMS_PER_PAGE);
  }, [categorias]);

  const visible = categorias.length > 0 ? shuffled : [];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {visible.map((item) => {
        const Icon = getIcon(item.icone);
        return (
          <button
            key={item.id}
            onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(item.nome)}`)}
            className="group flex flex-col items-center gap-3 bg-card border border-border/60 p-5 rounded-[24px] cursor-pointer hover:border-primary/30 active:scale-[0.96] transition-all hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.08)]"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/[0.05] group-hover:bg-primary/[0.08] flex items-center justify-center transition-colors">
              <Icon size={24} className="text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground leading-tight text-center">{item.nome}</span>
          </button>
        );
      })}
    </div>
  );
};

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
      <div className="flex flex-col gap-8">
        {/* ═══ BANNER ═══ */}
        {banners.length > 0 && (
          <div
            onClick={() => { const b = banners[bannerIdx]; if (b?.whatsapp) { window.open(`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`, "_blank"); } else if (b?.link) { window.open(b.link, "_blank"); } }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="rounded-[32px] overflow-hidden relative cursor-pointer group shadow-lg shadow-black/5"
            className="rounded-[32px] overflow-hidden relative cursor-pointer group shadow-lg shadow-black/5 aspect-[21/9] sm:aspect-[21/7] h-auto"
          >
            {banners[bannerIdx]?.imagem_url ? (
              <img src={banners[bannerIdx].imagem_url} alt={banners[bannerIdx].titulo} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-header-bg to-primary" />
            )}
            
            {/* Overlay gradient for text readability if title exists */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1] flex gap-2">
                {banners.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === bannerIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ ATALHOS RÁPIDOS ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-primary rounded-full" />
            <h2 className="text-xl font-black tracking-tight text-foreground uppercase text-[13px] opacity-40">Facilidades</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <button
              onClick={() => {}}
              className="group text-left p-5 rounded-[28px] flex flex-col gap-4 relative overflow-hidden transition-all bg-gradient-to-br from-primary/50 to-orange-400/50 shadow-xl shadow-primary/5 border border-white/5 cursor-default grayscale-[0.8] opacity-70"
            >
              <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 transition-transform">
                <CalendarCheck size={22} className="text-white" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[15px] font-black text-white leading-tight">Reservas</p>
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Em breve</p>
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-2xl" />
            </button>

            <button
              onClick={() => {}}
              className="group text-left p-5 rounded-[28px] flex flex-col gap-4 relative overflow-hidden transition-all bg-gradient-to-br from-indigo-500/50 to-purple-500/50 shadow-xl shadow-indigo-500/5 border border-white/5 cursor-default grayscale-[0.8] opacity-70"
            >
              <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 relative transition-transform">
                <Package size={22} className="text-white" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-white text-indigo-600 text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                    {pendingCount}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-[15px] font-black text-white leading-tight">Encomendas</p>
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Em breve</p>
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-2xl" />
            </button>
          </div>
        </div>

        {/* ═══ NEWS TICKER ═══ */}
        {avisos.length > 0 && (
          <div className="rounded-2xl overflow-hidden bg-primary/5 border border-primary/10 p-3.5 flex items-center gap-3">
            <div className="flex-shrink-0 bg-primary/10 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <Sparkles size={12} className="text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-wider">News</span>
            </div>
            <div className="overflow-hidden flex-1 relative">
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/0 to-transparent z-10" />
              <p className="whitespace-nowrap animate-[ticker_20s_linear_infinite] text-[13px] font-semibold text-foreground/80 flex items-center">
                {avisos.map((a: any, i: number) => (
                  <span key={a.id} className="flex items-center">
                    {i > 0 && <span className="mx-4 text-primary/30">•</span>}
                    {a.texto}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}

        {/* ═══ SERVIÇOS ═══ */}
        <section>
          <div className="flex justify-between items-end mb-5 px-1">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Serviços</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Para o seu dia a dia</p>
            </div>
            <button 
              onClick={() => navigate("/morador/servicos/categorias")} 
              className="text-[13px] font-bold text-primary hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              Ver Tudo <ArrowRight size={14} />
            </button>
          </div>
          <RotatingServicos categorias={allCategorias} navigate={navigate} />
        </section>

        {/* ═══ PRESTADORES NO CONDOMÍNIO ═══ */}
        {prestadoresVisiveis.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5 px-1">
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  No Condomínio <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                </h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Profissionais por perto</p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide" style={hs}>
              {prestadoresVisiveis.map((p) => {
                const mins = Math.max(0, Math.ceil((new Date(p.visivel_ate).getTime() - Date.now()) / 60000));
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(p.especialidade)}`)}
                    className="flex-shrink-0 rounded-[28px] bg-card border border-border/60 p-5 cursor-pointer text-left min-w-[240px] shadow-sm hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.97]"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-primary/10">
                        {p.nome?.charAt(0)?.toUpperCase() || "P"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-foreground truncate">{p.nome}</p>
                        <p className="text-xs font-black text-primary uppercase tracking-wider">{p.especialidade}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-muted/50 p-3 rounded-2xl">
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Disponibilidade</span>
                      <span className="text-[11px] text-success font-black uppercase tracking-wider">{mins} MIN</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ CONVITES ATIVOS ═══ */}
        {(activeConvitesCount > 0 || pendingCount > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {productList.slice(0, 4).map((product: any, idx: number) => (
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {desapegoList.slice(0, 4).map((item: any, idx: number) => (
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

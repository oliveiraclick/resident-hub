import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Wrench, Zap, Droplets, TreePine, SprayCan, Paintbrush, Hammer, ShoppingBag, ChevronLeft, ChevronRight, Repeat, Info, MapPin, Home, Smartphone, UtensilsCrossed, Scissors, Car, Truck, PawPrint, Sofa, AirVent, Bug, Wifi, Shirt, Dumbbell, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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


const serviceCategories = [
  {
    group: "Para sua Casa",
    items: [
      { label: "Eletricista", icon: Zap, path: "/morador/servicos?q=Eletricista" },
      { label: "Encanador", icon: Droplets, path: "/morador/servicos?q=Encanador" },
      { label: "Pintura", icon: Paintbrush, path: "/morador/servicos?q=Pintura" },
      { label: "Reparos", icon: Hammer, path: "/morador/servicos?q=Reparos" },
      { label: "Jardinagem", icon: TreePine, path: "/morador/servicos?q=Jardinagem" },
      { label: "Faxina", icon: SprayCan, path: "/morador/servicos?q=Faxina" },
      { label: "Limpeza", icon: Sparkles, path: "/morador/servicos?q=Limpeza" },
      { label: "Móveis", icon: Sofa, path: "/morador/servicos?q=Móveis" },
      { label: "Ar Cond.", icon: AirVent, path: "/morador/servicos?q=Ar Condicionado" },
      { label: "Dedetização", icon: Bug, path: "/morador/servicos?q=Dedetização" },
    ],
  },
  {
    group: "Tecnologia",
    items: [
      { label: "Internet", icon: Wifi, path: "/morador/servicos?q=Internet" },
      { label: "Eletrônicos", icon: Smartphone, path: "/morador/servicos?q=Eletrônicos" },
    ],
  },
  {
    group: "Alimentação",
    items: [
      { label: "Confeitaria", icon: UtensilsCrossed, path: "/morador/servicos?q=Confeitaria" },
      { label: "Marmitas", icon: UtensilsCrossed, path: "/morador/servicos?q=Marmitas" },
    ],
  },
  {
    group: "Pra Você",
    items: [
      { label: "Costura", icon: Scissors, path: "/morador/servicos?q=Costura" },
      { label: "Lavanderia", icon: Shirt, path: "/morador/servicos?q=Lavanderia" },
      { label: "Personal", icon: Dumbbell, path: "/morador/servicos?q=Personal" },
    ],
  },
  {
    group: "Para seu Veículo",
    items: [
      { label: "Mecânico", icon: Car, path: "/morador/servicos?q=Mecânico" },
      { label: "Lavagem", icon: Car, path: "/morador/servicos?q=Lavagem" },
    ],
  },
  {
    group: "Mudança",
    items: [
      { label: "Mudança", icon: Truck, path: "/morador/servicos?q=Mudança" },
      { label: "Carreto", icon: Truck, path: "/morador/servicos?q=Carreto" },
    ],
  },
  {
    group: "Para seu Pet",
    items: [
      { label: "Pet Shop", icon: PawPrint, path: "/morador/servicos?q=Pet Shop" },
      { label: "Dog Walker", icon: PawPrint, path: "/morador/servicos?q=Dog Walker" },
    ],
  },
];

// Flat list for initial preview (first 4)
const allServiceItems = serviceCategories.flatMap((c) => c.items);

const MoradorHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [desapegos, setDesapegos] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<any[]>([]);
  const [prestadoresVisiveis, setPrestadoresVisiveis] = useState<any[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [showAllServices, setShowAllServices] = useState(false);
  const shopRef = useRef<HTMLDivElement>(null);
  const desapegoRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    const fetchPending = async () => {
      const { count } = await supabase
        .from("pacotes")
        .select("id", { count: "exact", head: true })
        .eq("morador_id", user.id)
        .in("status", ["RECEBIDO", "AGUARDANDO_RETIRADA", "TRIADO"]);
      setPendingCount(count || 0);
    };

    const fetchProdutos = async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, titulo, preco, status")
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(8);
      setProdutos(data || []);
    };

    const fetchDesapegos = async () => {
      const { data } = await supabase
        .from("desapegos")
        .select("id, titulo, preco, status")
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(8);
      setDesapegos(data || []);
    };

    const fetchBanners = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      setBanners(data || []);
    };

    const fetchAvisos = async () => {
      const { data } = await supabase
        .from("avisos")
        .select("id, texto")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      setAvisos(data || []);
    };

    const fetchPrestadoresVisiveis = async () => {
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
    };

    fetchPending();
    fetchProdutos();
    fetchDesapegos();
    fetchBanners();
    fetchAvisos();
    fetchPrestadoresVisiveis();
  }, [user]);

  return (
    <MoradorLayout title="Início" showSearch>
      <div className="flex flex-col gap-6">
        {/* Serviços */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold text-foreground">Serviços</h2>
            <button onClick={() => setShowAllServices((v) => !v)} className="text-[11px] font-semibold text-primary uppercase tracking-wide">
              {showAllServices ? "Ver menos" : "Ver tudo"}
            </button>
          </div>

          {!showAllServices ? (
            <div className="grid grid-cols-4 gap-3">
              {allServiceItems.slice(0, 4).map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <div className="h-14 w-14 rounded-2xl bg-card shadow-sm flex items-center justify-center">
                    <item.icon size={22} className="text-primary" />
                  </div>
                  <span className="text-[11px] font-medium text-foreground leading-tight text-center">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {serviceCategories.map((cat) => (
                <div key={cat.group}>
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {cat.group}
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {cat.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <div className="h-14 w-14 rounded-2xl bg-card shadow-sm flex items-center justify-center">
                          <item.icon size={22} className="text-primary" />
                        </div>
                        <span className="text-[11px] font-medium text-foreground leading-tight text-center">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prestadores no condomínio */}
        {prestadoresVisiveis.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin size={16} className="text-primary" />
              <h2 className="text-[16px] font-semibold text-foreground">No condomínio agora</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {prestadoresVisiveis.map((p) => {
                const mins = Math.max(0, Math.ceil((new Date(p.visivel_ate).getTime() - Date.now()) / 60000));
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(p.especialidade)}`)}
                    className="flex-shrink-0 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 active:scale-[0.97] transition-transform"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-[14px] font-bold text-primary">
                      {p.nome?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-foreground leading-tight">{p.nome}</p>
                      <p className="text-[11px] text-primary font-medium">{p.especialidade}</p>
                      <p className="text-[10px] text-muted-foreground">Disponível por {mins} min</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Banner de encomendas - só aparece se tiver pendentes */}
        {pendingCount > 0 && (
          <button
            onClick={() => navigate("/morador/encomendas")}
            className="rounded-card bg-primary/5 p-4 flex items-center gap-4 w-full text-left active:scale-[0.98] transition-transform"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">
                Você tem {pendingCount} encomenda{pendingCount > 1 ? "s" : ""}!
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Confira suas entregas pendentes</p>
            </div>
          </button>
        )}

        {/* Ad Banner - Dinâmico */}
        {banners.length > 0 && (
          <div
            className="rounded-card overflow-hidden relative h-[160px] active:scale-[0.98] transition-transform cursor-pointer"
            onClick={() => {
              const link = banners[bannerIdx]?.link;
              if (link) window.open(link, "_blank");
            }}
          >
            {banners[bannerIdx]?.imagem_url ? (
              <img
                src={banners[bannerIdx].imagem_url}
                alt={banners[bannerIdx].titulo}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-primary/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent" />
            <div className="relative z-10 flex flex-col justify-end h-full p-4">
              <p className="text-[17px] font-bold text-primary-foreground leading-tight mt-0.5">{banners[bannerIdx]?.titulo}</p>
              {banners[bannerIdx]?.subtitulo && (
                <p className="text-[11px] text-primary-foreground/70 mt-1">{banners[bannerIdx].subtitulo}</p>
              )}
            </div>
            {banners.length > 1 && (
              <div className="absolute bottom-2 right-3 z-10 flex gap-1">
                {banners.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }}
                    className={`w-2 h-2 rounded-full ${i === bannerIdx ? "bg-primary-foreground" : "bg-primary-foreground/40"}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Breaking News Ticker */}
        {avisos.length > 0 && (
          <div className="rounded-full bg-primary px-4 py-2.5 overflow-hidden relative">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wider flex-shrink-0 bg-primary-foreground/20 px-2.5 py-0.5 rounded-full">
                News
              </span>
              <div className="overflow-hidden flex-1">
                <p className="whitespace-nowrap animate-[ticker_18s_linear_infinite] text-[12px] font-medium text-primary-foreground flex items-center gap-1">
                  {avisos.map((a, i) => (
                    <span key={a.id} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-foreground/50 mx-2 flex-shrink-0" />}
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">De prestadores</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <ShoppingBag size={16} className="text-primary" />
              <h2 className="text-[16px] font-semibold text-foreground">Vitrine E-shop</h2>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground">
                      <Info size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-[12px]">
                    Produtos e serviços oferecidos por prestadores cadastrados na plataforma.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <button
              onClick={() => navigate("/morador/produtos")}
              className="text-[11px] font-semibold text-primary uppercase tracking-wide"
            >
              Ver tudo
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollCarousel(shopRef, "left")}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card shadow-md flex items-center justify-center"
            >
              <ChevronLeft size={16} className="text-foreground" />
            </button>

            <div
              ref={shopRef}
              className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {(produtos.length > 0 ? produtos : [
                { id: "mock-1", titulo: "Bolo Caseiro", preco: 25, status: "ativo" },
                { id: "mock-2", titulo: "Sabonete Artesanal", preco: 12, status: "ativo" },
                { id: "mock-3", titulo: "Brigadeiro Gourmet", preco: 3.5, status: "ativo" },
                { id: "mock-4", titulo: "Vela Aromática", preco: 18, status: "ativo" },
              ]).map((product, idx) => (
                <button
                  key={product.id}
                  onClick={() => product.id.startsWith("mock") ? navigate("/morador/produtos") : navigate(`/morador/produtos/${product.id}`)}
                  className="flex-shrink-0 w-[140px] active:scale-95 transition-transform"
                >
                  <Card className="border-0 shadow-sm overflow-hidden">
                    <div className="h-[100px] overflow-hidden">
                      <img src={fallbackShopImages[idx % fallbackShopImages.length]} alt={product.titulo} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <span className="text-[9px] font-semibold text-primary uppercase">Loja</span>
                      <p className="text-[13px] font-medium text-foreground mt-0.5 leading-tight truncate">{product.titulo}</p>
                      {product.preco != null && (
                        <p className="text-[13px] font-bold text-primary mt-1">
                          R$ {Number(product.preco).toFixed(2).replace(".", ",")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollCarousel(shopRef, "right")}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card shadow-md flex items-center justify-center"
            >
              <ChevronRight size={16} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Separador */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-border" />
          <span className="text-[10px] text-muted-foreground font-medium">•</span>
          <div className="flex-1 h-[1px] bg-border" />
        </div>

        {/* Vitrine Desapego */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">Entre vizinhos</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Repeat size={16} className="text-primary" />
              <h2 className="text-[16px] font-semibold text-foreground">Desapego</h2>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground">
                      <Info size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-[12px]">
                    Itens usados à venda ou doação entre moradores do condomínio.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <button
              onClick={() => navigate("/morador/desapegos")}
              className="text-[11px] font-semibold text-primary uppercase tracking-wide"
            >
              Ver tudo
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollCarousel(desapegoRef, "left")}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card shadow-md flex items-center justify-center"
            >
              <ChevronLeft size={16} className="text-foreground" />
            </button>

            <div
              ref={desapegoRef}
              className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {(desapegos.length > 0 ? desapegos : [
                { id: "mock-1", titulo: "Bicicleta Aro 29", preco: 450, status: "ativo" },
                { id: "mock-2", titulo: "Sofá 3 Lugares", preco: 800, status: "ativo" },
                { id: "mock-3", titulo: "Livros Diversos", preco: 5, status: "ativo" },
                { id: "mock-4", titulo: "Carrinho de Bebê", preco: 350, status: "ativo" },
              ]).map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => item.id.startsWith("mock") ? navigate("/morador/desapegos") : navigate(`/morador/desapegos/${item.id}`)}
                  className="flex-shrink-0 w-[140px] active:scale-95 transition-transform"
                >
                  <Card className="border-0 shadow-sm overflow-hidden">
                    <div className="h-[100px] overflow-hidden">
                      <img src={fallbackDesapegoImages[idx % fallbackDesapegoImages.length]} alt={item.titulo} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <span className="text-[9px] font-semibold text-primary uppercase">Desapego</span>
                      <p className="text-[13px] font-medium text-foreground mt-0.5 leading-tight truncate">{item.titulo}</p>
                      {item.preco != null && (
                        <p className="text-[13px] font-bold text-primary mt-1">
                          R$ {Number(item.preco).toFixed(2).replace(".", ",")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollCarousel(desapegoRef, "right")}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card shadow-md flex items-center justify-center"
            >
              <ChevronRight size={16} className="text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </MoradorLayout>
  );
};

export default MoradorHome;

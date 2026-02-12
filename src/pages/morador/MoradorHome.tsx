import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Wrench, Zap, Droplets, TreePine, SprayCan, Paintbrush, Hammer, ShoppingBag, ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import bannerCarnaval from "@/assets/banner-carnaval.jpg";
import productBolo from "@/assets/product-bolo.jpg";
import productSabonete from "@/assets/product-sabonete.jpg";
import productBrigadeiro from "@/assets/product-brigadeiro.jpg";
import productVela from "@/assets/product-vela.jpg";
import desapegoBike from "@/assets/desapego-bike.jpg";
import desapegoSofa from "@/assets/desapego-sofa.jpg";
import desapegoLivros from "@/assets/desapego-livros.jpg";
import desapegoCarrinho from "@/assets/desapego-carrinho.jpg";


const serviceShortcuts = [
  { label: "Jardinagem", icon: TreePine, path: "/morador/servicos" },
  { label: "Faxina", icon: SprayCan, path: "/morador/servicos" },
  { label: "Eletricista", icon: Zap, path: "/morador/servicos" },
  { label: "Encanador", icon: Droplets, path: "/morador/servicos" },
  { label: "Pintura", icon: Paintbrush, path: "/morador/servicos" },
  { label: "Reparos", icon: Hammer, path: "/morador/servicos" },
  { label: "Limpeza", icon: Wrench, path: "/morador/servicos" },
  { label: "Outros", icon: Wrench, path: "/morador/servicos" },
];

const MoradorHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
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
    fetchPending();
  }, [user]);

  return (
    <MoradorLayout title="Início" showSearch>
      <div className="flex flex-col gap-6">
        {/* Serviços - 4 por linha */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold text-foreground">Serviços</h2>
            <button className="text-[11px] font-semibold text-primary uppercase tracking-wide">
              Ver tudo
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {serviceShortcuts.slice(0, 4).map((item) => (
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

        {/* Ad Banner - Imagem */}
        <div className="rounded-card overflow-hidden relative h-[160px] active:scale-[0.98] transition-transform cursor-pointer">
          <img
            src={bannerCarnaval}
            alt="Festa de Carnaval no Splendido"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent" />
          <div className="relative z-10 flex flex-col justify-end h-full p-4">
            <p className="text-[10px] font-semibold text-primary-foreground/80 uppercase tracking-wide">Evento</p>
            <p className="text-[17px] font-bold text-primary-foreground leading-tight mt-0.5">Carnaval no<br/>Splendido 🎭</p>
            <p className="text-[11px] text-primary-foreground/70 mt-1">Dia 01/03 às 15h · Área de lazer</p>
          </div>
        </div>

        {/* Breaking News Ticker */}
        <div className="rounded-full bg-primary px-4 py-2.5 overflow-hidden relative">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wider flex-shrink-0 bg-primary-foreground/20 px-2.5 py-0.5 rounded-full">
              News
            </span>
            <div className="overflow-hidden flex-1">
              <p className="whitespace-nowrap animate-[ticker_18s_linear_infinite] text-[12px] font-medium text-primary-foreground">
                🚰 Manutenção na piscina dia 05/03 · 🔧 Elevador B em manutenção até 28/02 · 🎉 Assembleia geral dia 10/03 às 19h · 📦 Horário da portaria alterado: 7h às 22h
              </p>
            </div>
          </div>
        </div>

        {/* Vitrine E-shop */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-primary" />
              <h2 className="text-[16px] font-semibold text-foreground">Vitrine E-shop</h2>
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
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card shadow-md flex items-center justify-center"
            >
              <ChevronLeft size={16} className="text-foreground" />
            </button>

            <div
              ref={shopRef}
              className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {[
                { name: "Bolo Caseiro", price: "R$ 25,00", tag: "Food", img: productBolo },
                { name: "Sabonete Artesanal", price: "R$ 12,00", tag: "Beleza", img: productSabonete },
                { name: "Brigadeiro Gourmet", price: "R$ 3,50", tag: "Food", img: productBrigadeiro },
                { name: "Vela Aromática", price: "R$ 18,00", tag: "Casa", img: productVela },
              ].map((product) => (
                <button
                  key={product.name}
                  onClick={() => navigate("/morador/produtos")}
                  className="flex-shrink-0 w-[140px] active:scale-95 transition-transform"
                >
                  <Card className="border-0 shadow-sm overflow-hidden">
                    <div className="h-[100px] overflow-hidden">
                      <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <span className="text-[9px] font-semibold text-primary uppercase">{product.tag}</span>
                      <p className="text-[13px] font-medium text-foreground mt-0.5 leading-tight truncate">{product.name}</p>
                      <p className="text-[13px] font-bold text-primary mt-1">{product.price}</p>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollCarousel(shopRef, "right")}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card shadow-md flex items-center justify-center"
            >
              <ChevronRight size={16} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Vitrine Desapego */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Repeat size={16} className="text-primary" />
              <h2 className="text-[16px] font-semibold text-foreground">Desapego</h2>
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
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card shadow-md flex items-center justify-center"
            >
              <ChevronLeft size={16} className="text-foreground" />
            </button>

            <div
              ref={desapegoRef}
              className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {[
                { name: "Bicicleta Aro 29", price: "R$ 450,00", tag: "Esporte", img: desapegoBike },
                { name: "Sofá 3 Lugares", price: "R$ 800,00", tag: "Móveis", img: desapegoSofa },
                { name: "Livros Diversos", price: "R$ 5,00", tag: "Livros", img: desapegoLivros },
                { name: "Carrinho de Bebê", price: "R$ 350,00", tag: "Bebê", img: desapegoCarrinho },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate("/morador/desapegos")}
                  className="flex-shrink-0 w-[140px] active:scale-95 transition-transform"
                >
                  <Card className="border-0 shadow-sm overflow-hidden">
                    <div className="h-[100px] overflow-hidden">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <span className="text-[9px] font-semibold text-primary uppercase">{item.tag}</span>
                      <p className="text-[13px] font-medium text-foreground mt-0.5 leading-tight truncate">{item.name}</p>
                      <p className="text-[13px] font-bold text-primary mt-1">{item.price}</p>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollCarousel(desapegoRef, "right")}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card shadow-md flex items-center justify-center"
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

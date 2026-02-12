import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Wrench, Zap, Droplets, TreePine, SprayCan, Paintbrush, Hammer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import bannerCarnaval from "@/assets/banner-carnaval.jpg";

const categories = [
  { label: "Serviços", active: true },
  { label: "Food", active: false },
  { label: "Entretenimento", active: false },
];

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
        {/* Category Tabs */}
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.label}
              className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                cat.active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
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
        <div className="rounded-full bg-foreground/5 px-4 py-2.5 overflow-hidden relative">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex-shrink-0 bg-primary/10 px-2 py-0.5 rounded-full">
              News
            </span>
            <div className="overflow-hidden flex-1">
              <p className="whitespace-nowrap animate-[ticker_18s_linear_infinite] text-[12px] font-medium text-foreground">
                🚰 Manutenção na piscina dia 05/03 · 🔧 Elevador B em manutenção até 28/02 · 🎉 Assembleia geral dia 10/03 às 19h · 📦 Horário da portaria alterado: 7h às 22h
              </p>
            </div>
          </div>
        </div>

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
      </div>
    </MoradorLayout>
  );
};

export default MoradorHome;

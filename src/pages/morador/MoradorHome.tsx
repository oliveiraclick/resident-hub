import { useNavigate } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Wrench, Zap, Droplets, TreePine, SprayCan, Paintbrush, Hammer } from "lucide-react";

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

        {/* Banner */}
        <div className="rounded-card bg-primary/5 p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package size={26} className="text-primary" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">Você tem encomendas!</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Confira suas entregas pendentes</p>
          </div>
        </div>

        {/* Service Shortcuts - 4 per row */}
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

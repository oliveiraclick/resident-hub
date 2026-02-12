import { useNavigate } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Wrench, Repeat, ShoppingBag, QrCode, Star } from "lucide-react";

const categories = [
  { label: "Serviços", active: true },
  { label: "Food", active: false },
  { label: "Entretenimento", active: false },
];

const quickActions = [
  {
    label: "Serviços",
    description: "Encontre prestadores",
    icon: Wrench,
    path: "/morador/servicos",
  },
  {
    label: "Desapego",
    description: "Doe ou venda itens",
    icon: Repeat,
    path: "/morador/desapegos",
  },
  {
    label: "E-shop",
    description: "Produtos do condomínio",
    icon: ShoppingBag,
    path: "/morador/produtos",
  },
  {
    label: "Encomendas",
    description: "Confirme retiradas",
    icon: Package,
    path: "/morador/encomendas",
  },
  {
    label: "Meu QR ID",
    description: "Identificação pessoal",
    icon: QrCode,
    path: "/morador/qr-id",
  },
  {
    label: "Avaliações",
    description: "Avalie prestadores",
    icon: Star,
    path: "/morador/avaliacoes",
  },
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

        {/* Banner Placeholder */}
        <div className="rounded-card bg-primary/5 p-5 flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package size={28} className="text-primary" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">Você tem encomendas!</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Confira suas entregas pendentes</p>
          </div>
        </div>

        {/* Section: Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold text-foreground">Atalhos</h2>
            <button className="text-[11px] font-semibold text-primary uppercase tracking-wide">
              Ver tudo
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Card
                key={action.path}
                className="cursor-pointer active:scale-[0.97] transition-transform border-0 shadow-sm"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="flex flex-col items-center gap-2.5 p-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8">
                    <action.icon size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{action.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MoradorLayout>
  );
};

export default MoradorHome;

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Wrench, Repeat, ShoppingBag, QrCode, Star } from "lucide-react";

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
  const { user } = useAuth();

  return (
    <MoradorLayout title="Início">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Greeting */}
        <div className="py-2">
          <p className="text-subtitle text-muted-foreground">Olá,</p>
          <h1 className="text-title-lg text-foreground">
            {(user?.user_metadata?.nome as string) || "Morador"}
          </h1>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="cursor-pointer active:scale-[0.97] transition-transform"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-button bg-primary/10">
                  <action.icon size={22} className="text-primary" />
                </div>
                <p className="text-body font-semibold">{action.label}</p>
                <p className="text-label text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MoradorLayout>
  );
};

export default MoradorHome;

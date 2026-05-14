import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, MapPin, CheckCircle, History } from "lucide-react";

const menuItems = [
  {
    label: "Recebimento (Lote)",
    description: "Registrar chegada da transportadora",
    icon: PlusCircle,
    path: "/admin/encomendas/novo-lote",
  },
  {
    label: "Endereçamento (Triagem)",
    description: "Vincular pacotes aos moradores",
    icon: MapPin,
    path: "/admin/encomendas/triagem",
  },
  {
    label: "Entrega de Encomenda",
    description: "Entregar pacote ao morador",
    icon: CheckCircle,
    path: "/admin/encomendas/retirada",
  },
  {
    label: "Histórico",
    description: "Ver todas as encomendas",
    icon: History,
    path: "/admin/encomendas/historico",
  },
];

const EncomendasIndex = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout title="Encomendas" showBack={true}>
      <div className="flex flex-col gap-3 max-w-2xl mx-auto">
        {menuItems.map((item) => (
          <Card
            key={item.path}
            className="cursor-pointer active:scale-[0.98] transition-all hover:border-primary/50"
            onClick={() => navigate(item.path)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-button bg-primary/10">
                <item.icon size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default EncomendasIndex;

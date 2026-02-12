import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Package, PlusCircle, ScanLine, ArrowRightLeft, CheckCircle, History } from "lucide-react";

const menuItems = [
  {
    label: "Novo Lote",
    description: "Registrar recebimento de encomendas",
    icon: PlusCircle,
    path: "/admin/encomendas/novo-lote",
  },
  {
    label: "Leitura",
    description: "Ler QR code de pacote",
    icon: ScanLine,
    path: "/admin/encomendas/leitura",
  },
  {
    label: "Triagem",
    description: "Vincular pacote ao morador",
    icon: ArrowRightLeft,
    path: "/admin/encomendas/triagem",
  },
  {
    label: "Retirada",
    description: "Confirmar retirada de pacote",
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
      <div className="flex flex-col gap-3">
        {menuItems.map((item) => (
          <Card
            key={item.path}
            className="cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate(item.path)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-button bg-primary/10">
                <item.icon size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-title-md">{item.label}</p>
                <p className="text-subtitle text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default EncomendasIndex;

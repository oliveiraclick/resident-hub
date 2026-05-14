import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, MapPin, CheckCircle, History, Package } from "lucide-react";

const menuItems = [
  {
    label: "Recebimento (Lote)",
    description: "Registrar chegada da transportadora",
    icon: PlusCircle,
    color: "bg-blue-500",
    path: "/admin/encomendas/novo-lote",
  },
  {
    label: "Endereçamento (Triagem)",
    description: "Vincular pacotes aos moradores",
    icon: MapPin,
    color: "bg-orange-500",
    path: "/admin/encomendas/triagem",
  },
  {
    label: "Entrega de Encomenda",
    description: "Entregar pacote ao morador",
    icon: CheckCircle,
    color: "bg-emerald-500",
    path: "/admin/encomendas/retirada",
  },
  {
    label: "Histórico",
    description: "Ver todas as encomendas",
    icon: History,
    color: "bg-indigo-500",
    path: "/admin/encomendas/historico",
  },
];

const EncomendasIndex = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout title="Encomendas" showBack={true}>
      <div className="flex flex-col gap-8 max-w-2xl mx-auto pb-20">
        <header className="px-1">
          <div className="flex items-center gap-3 mb-2">
             <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <Package size={24} />
             </div>
             <h1 className="text-4xl font-black tracking-tight">Encomendas</h1>
          </div>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] ml-1">
            Gestão de fluxos e entregas
          </p>
        </header>

        <div className="grid gap-4">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="group cursor-pointer border-none shadow-soft hover:shadow-premium rounded-[32px] transition-all active:scale-[0.98] overflow-hidden"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="flex items-center gap-5 p-6 relative">
                <div className={`flex h-16 w-16 items-center justify-center rounded-[22px] ${item.color} text-white shadow-lg transition-transform group-hover:scale-110 duration-300`}>
                  <item.icon size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-black tracking-tight text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground font-medium">{item.description}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <PlusCircle size={20} className={item.label.includes('Novo') ? '' : 'rotate-45'} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default EncomendasIndex;

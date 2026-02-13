import AdminLayout from "@/components/AdminLayout";
import { Package, DollarSign, Users, Settings, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";

const cards = [
  { icon: Package, label: "Encomendas", path: "/admin/encomendas", color: "bg-blue-100 text-blue-600" },
  { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro", color: "bg-green-100 text-green-600" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios", color: "bg-purple-100 text-purple-600" },
  { icon: Image, label: "Banners", path: "/admin/banners", color: "bg-pink-100 text-pink-600" },
  { icon: Settings, label: "Configurações", path: "/admin/configuracoes", color: "bg-orange-100 text-orange-600" },
];

const AdminHome = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout title="Dashboard">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Painel Administrativo</h2>
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className="flex flex-col items-center gap-2 rounded-2xl bg-card p-5 shadow-sm border border-border active:scale-95 transition-transform"
            >
              <div className={`rounded-xl p-3 ${card.color}`}>
                <card.icon size={24} />
              </div>
              <span className="text-sm font-medium text-foreground">{card.label}</span>
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHome;

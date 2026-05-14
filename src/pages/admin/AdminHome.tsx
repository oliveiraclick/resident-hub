import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign, Users, Settings, Image, Megaphone, CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const cards = [
  { icon: Package, label: "Encomendas", path: "/admin/encomendas", color: "bg-blue-100 text-blue-600" },
  { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro", color: "bg-green-100 text-green-600" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios", color: "bg-purple-100 text-purple-600" },
  { icon: CalendarCheck, label: "Espaços", path: "/admin/espacos", color: "bg-orange-100 text-orange-600" },
  { icon: Image, label: "Banners", path: "/admin/banners", color: "bg-pink-100 text-pink-600" },
  { icon: Megaphone, label: "Avisos", path: "/admin/avisos", color: "bg-yellow-100 text-yellow-600" },
  { icon: Settings, label: "Configurações", path: "/admin/configuracoes", color: "bg-stone-100 text-stone-600" },
];

const AdminHome = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout title="Administração">
      <div className="flex flex-col gap-8 pb-20">
        <header className="px-1">
          <h1 className="text-4xl font-black tracking-tight mb-2">Painel Gestão</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">
            Bem-vindo ao centro de controle
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {cards.map((card) => (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className="group flex flex-col items-center justify-center gap-5 rounded-[40px] bg-card p-8 border border-border/60 hover:border-primary/30 hover:shadow-premium transition-all active:scale-[0.96] relative overflow-hidden"
            >
              {/* Abstract decorative background */}
              <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 blur-2xl rounded-full ${card.color.split(' ')[0]}`} />
              
              <div className={`rounded-[24px] p-5 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform ${card.color}`}>
                <card.icon size={28} />
              </div>
              <div className="space-y-1">
                <span className="text-base font-black text-foreground block tracking-tight">{card.label}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 group-hover:text-primary transition-colors">Acessar</span>
              </div>
            </button>
          ))}
        </div>

        {/* Quick status/stats section placeholder */}
        <section className="mt-4 grid gap-4 animate-in fade-in-up duration-700">
           <Card className="border-none shadow-soft rounded-[32px] bg-primary/5">
             <CardContent className="p-8 flex items-center justify-between">
               <div className="space-y-1">
                 <p className="text-sm font-black text-primary uppercase tracking-widest">Sistema Operacional</p>
                 <p className="text-2xl font-black tracking-tight">Tudo sob controle</p>
               </div>
               <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                 <div className="h-3 w-3 rounded-full bg-success animate-ping" />
               </div>
             </CardContent>
           </Card>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminHome;

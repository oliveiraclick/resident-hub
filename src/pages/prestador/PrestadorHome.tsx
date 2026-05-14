import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ShoppingBag, Wrench, DollarSign, Star,
  ArrowRight, MapPin, Building2, Gift, Image as ImageIcon, Sparkles, ChevronRight
} from "lucide-react";
import MissingPhotoModal from "@/components/MissingPhotoModal";
import PrestadorCupomCard from "@/components/PrestadorCupomCard";

const PrestadorHome = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [visivel, setVisivel] = useState(false);
  const [visivelAte, setVisivelAte] = useState<string | null>(null);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  const [stats, setStats] = useState({
    servicos: 0,
    produtos: 0,
    avaliacoes: 0,
    mediaNotas: 0,
  });

  useEffect(() => {
    if (!user || !condominioId) return;
    const fetchData = async () => {
      const [profileRes, prestRes] = await Promise.all([
        supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle(),
        supabase.from("prestadores").select("id, visivel, visivel_ate").eq("user_id", user.id).eq("condominio_id", condominioId).limit(1).maybeSingle(),
      ]);
      if (profileRes.data?.nome) setProfileName(profileRes.data.nome);
      if (!prestRes.data) { setLoading(false); return; }
      const pid = prestRes.data.id;
      setPrestadorId(pid);
      const isStillVisible = prestRes.data.visivel && prestRes.data.visivel_ate && new Date(prestRes.data.visivel_ate) > new Date();
      setVisivel(!!isStillVisible);
      setVisivelAte(prestRes.data.visivel_ate);
      const [servicosRes, produtosRes, avalRes, bannersRes] = await Promise.all([
        supabase.from("servicos").select("id", { count: "exact", head: true }).eq("prestador_id", pid).eq("status", "ativo"),
        supabase.from("produtos").select("id", { count: "exact", head: true }).eq("prestador_id", pid).eq("status", "ativo"),
        supabase.from("avaliacoes").select("nota").eq("avaliado_id", user.id).eq("condominio_id", condominioId),
        supabase.from("banners").select("*").eq("ativo", true).in("publico", ["prestador", "todos"]).order("ordem", { ascending: true }),
      ]);
      setBanners(bannersRes.data || []);
      const notas = avalRes.data || [];
      const media = notas.length > 0 ? notas.reduce((s, a) => s + a.nota, 0) / notas.length : 0;
      setStats({ servicos: servicosRes.count || 0, produtos: produtosRes.count || 0, avaliacoes: notas.length, mediaNotas: Math.round(media * 10) / 10 });
      setLoading(false);
    };
    fetchData();
  }, [user, condominioId]);

  const toggleVisibility = useCallback(async (checked: boolean) => {
    if (!prestadorId) return;
    setTogglingVisibility(true);
    try {
      if (checked) {
        const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
        await supabase.from("prestadores").update({ visivel: true, visivel_ate: expiresAt } as any).eq("id", prestadorId);
        setVisivel(true);
        setVisivelAte(expiresAt);
        toast.success("Você está visível!");
      } else {
        await supabase.from("prestadores").update({ visivel: false, visivel_ate: null } as any).eq("id", prestadorId);
        setVisivel(false);
        setVisivelAte(null);
        toast.info("Visibilidade desativada.");
      }
    } catch { toast.error("Erro."); }
    finally { setTogglingVisibility(false); }
  }, [prestadorId]);

  const remainingMinutes = visivelAte ? Math.max(0, Math.ceil((new Date(visivelAte).getTime() - Date.now()) / 60000)) : 0;

  return (
    <PrestadorLayout>
      <MissingPhotoModal />
      <div className="flex flex-col gap-8 pb-20 max-w-2xl mx-auto">
        <header className="px-1">
          <h1 className="text-4xl font-black tracking-tight mb-2">Seu Painel</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Gestão de Vendas e Serviços</p>
        </header>

        {/* Visibility Card — Premium Style */}
        <section className="animate-in fade-in duration-500">
           <Card className={`border-none shadow-premium rounded-[40px] overflow-hidden transition-all duration-500 ${visivel ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-card'}`}>
              <CardContent className="p-8 flex items-center justify-between gap-6">
                 <div className="flex items-center gap-5">
                    <div className={`h-16 w-16 rounded-[22px] flex items-center justify-center transition-all ${visivel ? 'bg-white/20 backdrop-blur-md shadow-inner-glass' : 'bg-primary/5 text-primary'}`}>
                       <MapPin size={32} className={visivel ? 'animate-bounce' : ''} />
                    </div>
                    <div className="space-y-1">
                       <p className={`text-xl font-black tracking-tight ${visivel ? 'text-white' : 'text-foreground'}`}>
                         {visivel ? 'Você está Visível' : 'Ficar Visível?'}
                       </p>
                       <p className={`text-sm font-medium ${visivel ? 'text-white/70' : 'text-muted-foreground'}`}>
                         {visivel ? `Ativo por mais ${remainingMinutes} min` : 'Apareça para os moradores agora'}
                       </p>
                    </div>
                 </div>
                 <Switch checked={visivel} onCheckedChange={toggleVisibility} disabled={togglingVisibility} className={visivel ? 'data-[state=checked]:bg-white/30' : ''} />
              </CardContent>
           </Card>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4 animate-in fade-in-up duration-500 delay-150">
           <Card className="border-none shadow-soft rounded-[32px] bg-card hover:shadow-premium transition-all cursor-pointer group" onClick={() => navigate("/prestador/servicos")}>
              <CardContent className="p-6 flex flex-col gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wrench size={24} />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-2xl font-black tracking-tighter">{stats.servicos}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Serviços Ativos</p>
                 </div>
              </CardContent>
           </Card>
           <Card className="border-none shadow-soft rounded-[32px] bg-card hover:shadow-premium transition-all cursor-pointer group" onClick={() => navigate("/prestador/produtos")}>
              <CardContent className="p-6 flex flex-col gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingBag size={24} />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-2xl font-black tracking-tighter">{stats.produtos}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Produtos Ativos</p>
                 </div>
              </CardContent>
           </Card>
           <Card className="col-span-2 border-none shadow-soft rounded-[32px] bg-gradient-to-br from-yellow-400/10 to-orange-400/5">
              <CardContent className="p-6 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-yellow-400/20 text-yellow-600 flex items-center justify-center">
                       <Star size={28} className="fill-yellow-500" />
                    </div>
                    <div className="space-y-0.5">
                       <p className="text-2xl font-black tracking-tighter">{stats.mediaNotas > 0 ? `${stats.mediaNotas} Estrelas` : 'Sem Notas'}</p>
                       <p className="text-sm font-bold text-yellow-700/60 uppercase tracking-widest text-[10px]">{stats.avaliacoes} Avaliações recebidas</p>
                    </div>
                 </div>
                 <Button variant="ghost" onClick={() => navigate("/prestador/avaliacoes")} className="rounded-2xl font-black text-xs uppercase tracking-widest">Ver Todas</Button>
              </CardContent>
           </Card>
        </section>

        {/* Quick Actions List */}
        <section className="space-y-3 animate-in fade-in-up duration-500 delay-300">
           <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-1.5 h-4 bg-primary rounded-full" />
              <h2 className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest">Ferramentas de Gestão</h2>
           </div>
           
           <div className="grid gap-3">
              {[
                { label: "📋 Painel de Cotações", icon: Sparkles, path: "/prestador/cotacoes", color: "text-blue-500 bg-blue-50" },
                { label: "💰 Controle Financeiro", icon: DollarSign, path: "/prestador/financeiro", color: "text-emerald-500 bg-emerald-50" },
                { label: "📢 Anunciar no App", icon: ImageIcon, path: "/prestador/banners", color: "text-pink-500 bg-pink-50" },
                { label: "🏘️ Meus Condomínios", icon: Building2, path: "/prestador/condominios", color: "text-indigo-500 bg-indigo-50" },
                { label: "🎁 Programa Indicações", icon: Gift, path: "/prestador/indicacoes", color: "text-orange-500 bg-orange-50" },
              ].map((action) => (
                <Card 
                  key={action.label} 
                  className="group border-none shadow-soft hover:shadow-md transition-all rounded-[28px] cursor-pointer bg-card overflow-hidden active:scale-[0.98]"
                  onClick={() => navigate(action.path)}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${action.color}`}>
                           <action.icon size={20} />
                        </div>
                        <span className="text-base font-black tracking-tight text-foreground/80">{action.label}</span>
                     </div>
                     <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ChevronRight size={18} />
                     </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </section>

        <footer className="text-center pt-4">
           <button onClick={() => navigate("/prestador/manual")} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-primary transition-colors">Precisa de Ajuda? Ver Manual</button>
        </footer>
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorHome;

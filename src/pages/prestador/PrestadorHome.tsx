import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag, Wrench, DollarSign, Star,
  ArrowRight,
} from "lucide-react";

const PrestadorHome = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);

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
        supabase.from("prestadores").select("id").eq("user_id", user.id).eq("condominio_id", condominioId).limit(1).maybeSingle(),
      ]);

      if (profileRes.data?.nome) setProfileName(profileRes.data.nome);
      if (!prestRes.data) { setLoading(false); return; }

      const pid = prestRes.data.id;
      setPrestadorId(pid);

      const [servicosRes, produtosRes, avalRes] = await Promise.all([
        supabase.from("servicos").select("id", { count: "exact", head: true }).eq("prestador_id", pid).eq("status", "ativo"),
        supabase.from("produtos").select("id", { count: "exact", head: true }).eq("prestador_id", pid).eq("status", "ativo"),
        supabase.from("avaliacoes").select("nota").eq("avaliado_id", user.id).eq("condominio_id", condominioId),
      ]);

      const notas = avalRes.data || [];
      const media = notas.length > 0 ? notas.reduce((s, a) => s + a.nota, 0) / notas.length : 0;

      setStats({
        servicos: servicosRes.count || 0,
        produtos: produtosRes.count || 0,
        avaliacoes: notas.length,
        mediaNotas: Math.round(media * 10) / 10,
      });
      setLoading(false);
    };

    fetchData();
  }, [user, condominioId]);

  

  return (
    <PrestadorLayout>
      <div className="flex flex-col gap-5">
        {/* Greeting */}
        <div>
          <p className="text-[13px] text-muted-foreground">Bem-vindo,</p>
          <h1 className="text-[20px] font-bold text-foreground">{profileName || "Prestador"} 👋</h1>
        </div>

        {loading ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
        ) : !prestadorId ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-[14px] text-muted-foreground">
                Seu cadastro de prestador não foi encontrado para este condomínio.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Activity Stats */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Meu Negócio</p>
              <div className="grid grid-cols-2 gap-3">
                <Card className="cursor-pointer active:scale-[0.97] transition-transform" onClick={() => navigate("/prestador/servicos")}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Wrench size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[20px] font-bold text-foreground leading-tight">{stats.servicos}</p>
                      <p className="text-[12px] text-muted-foreground">Serviços ativos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer active:scale-[0.97] transition-transform" onClick={() => navigate("/prestador/produtos")}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-11 w-11 rounded-2xl bg-accent flex items-center justify-center">
                      <ShoppingBag size={20} className="text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-[20px] font-bold text-foreground leading-tight">{stats.produtos}</p>
                      <p className="text-[12px] text-muted-foreground">Produtos ativos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-2">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-11 w-11 rounded-2xl bg-warning/10 flex items-center justify-center">
                      <Star size={20} className="text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[20px] font-bold text-foreground leading-tight">
                        {stats.mediaNotas > 0 ? `${stats.mediaNotas} ★` : "—"}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {stats.avaliacoes} {stats.avaliacoes === 1 ? "avaliação" : "avaliações"} recebidas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Acesso Rápido</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Gerenciar Serviços", icon: Wrench, path: "/prestador/servicos" },
                  { label: "Gerenciar Produtos", icon: ShoppingBag, path: "/prestador/produtos" },
                  { label: "Financeiro", icon: DollarSign, path: "/prestador/financeiro" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 active:scale-[0.98] transition-transform text-left"
                  >
                    <action.icon size={18} className="text-primary" />
                    <span className="text-[14px] font-medium text-foreground flex-1">{action.label}</span>
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorHome;

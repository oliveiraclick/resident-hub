import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag, Wrench, DollarSign, Star, TrendingUp, TrendingDown,
  ArrowRight, Package, AlertCircle,
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
    aReceber: 0,
    aPagar: 0,
    recebido: 0,
    vencidos: 0,
  });

  useEffect(() => {
    if (!user || !condominioId) return;

    const fetchData = async () => {
      // Profile + prestador in parallel
      const [profileRes, prestRes] = await Promise.all([
        supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle(),
        supabase.from("prestadores").select("id").eq("user_id", user.id).eq("condominio_id", condominioId).limit(1).maybeSingle(),
      ]);

      if (profileRes.data?.nome) setProfileName(profileRes.data.nome);
      if (!prestRes.data) { setLoading(false); return; }

      const pid = prestRes.data.id;
      setPrestadorId(pid);

      // Fetch all stats in parallel
      const [servicosRes, produtosRes, avalRes, finRes] = await Promise.all([
        supabase.from("servicos").select("id", { count: "exact", head: true }).eq("prestador_id", pid).eq("status", "ativo"),
        supabase.from("produtos").select("id", { count: "exact", head: true }).eq("prestador_id", pid).eq("status", "ativo"),
        supabase.from("avaliacoes").select("nota").eq("avaliado_id", user.id).eq("condominio_id", condominioId),
        supabase.from("financeiro_lancamentos").select("tipo, valor, status, vencimento").eq("prestador_id", pid).eq("condominio_id", condominioId),
      ]);

      const notas = avalRes.data || [];
      const media = notas.length > 0 ? notas.reduce((s, a) => s + a.nota, 0) / notas.length : 0;

      const fin = finRes.data || [];
      const aReceber = fin.filter((f) => f.tipo === "receita" && f.status === "pendente").reduce((s, f) => s + Number(f.valor), 0);
      const aPagar = fin.filter((f) => f.tipo === "despesa" && f.status === "pendente").reduce((s, f) => s + Number(f.valor), 0);
      const recebido = fin.filter((f) => f.tipo === "receita" && f.status === "pago").reduce((s, f) => s + Number(f.valor), 0);
      const hoje = new Date();
      const vencidos = fin.filter((f) => f.status === "pendente" && f.vencimento && new Date(f.vencimento) < hoje).length;

      setStats({
        servicos: servicosRes.count || 0,
        produtos: produtosRes.count || 0,
        avaliacoes: notas.length,
        mediaNotas: Math.round(media * 10) / 10,
        aReceber,
        aPagar,
        recebido,
        vencidos,
      });
      setLoading(false);
    };

    fetchData();
  }, [user, condominioId]);

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

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
            {/* Alerta de vencidos */}
            {stats.vencidos > 0 && (
              <button
                onClick={() => navigate("/prestador/financeiro")}
                className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-left"
              >
                <AlertCircle size={20} className="text-destructive flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-destructive">
                    {stats.vencidos} {stats.vencidos === 1 ? "conta vencida" : "contas vencidas"}
                  </p>
                  <p className="text-[11px] text-destructive/70">Toque para ver detalhes</p>
                </div>
                <ArrowRight size={16} className="text-destructive" />
              </button>
            )}

            {/* Financial Summary */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Resumo Financeiro</p>
              <div className="grid grid-cols-3 gap-2">
                <Card className="cursor-pointer active:scale-[0.97] transition-transform" onClick={() => navigate("/prestador/financeiro")}>
                  <CardContent className="p-3 text-center">
                    <TrendingUp size={16} className="text-success mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">A Receber</p>
                    <p className="text-[13px] font-bold text-success">{formatCurrency(stats.aReceber)}</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer active:scale-[0.97] transition-transform" onClick={() => navigate("/prestador/financeiro")}>
                  <CardContent className="p-3 text-center">
                    <TrendingDown size={16} className="text-destructive mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">A Pagar</p>
                    <p className="text-[13px] font-bold text-destructive">{formatCurrency(stats.aPagar)}</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer active:scale-[0.97] transition-transform" onClick={() => navigate("/prestador/financeiro")}>
                  <CardContent className="p-3 text-center">
                    <DollarSign size={16} className="text-primary mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Recebido</p>
                    <p className="text-[13px] font-bold text-primary">{formatCurrency(stats.recebido)}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

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

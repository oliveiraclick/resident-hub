import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Filter, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Lancamento {
  id: string;
  descricao: string | null;
  tipo: string;
  valor: number;
  status: string;
  vencimento: string | null;
  created_at: string;
}

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

const statusStyle: Record<string, string> = {
  pendente: "bg-warning/10 text-warning",
  pago: "bg-success/10 text-success",
  cancelado: "bg-destructive/10 text-destructive",
};

const PrestadorFinanceiro = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");

  useEffect(() => {
    if (!user || !condominioId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("prestadores")
        .select("id")
        .eq("user_id", user.id)
        .eq("condominio_id", condominioId)
        .maybeSingle();
      setPrestadorId(data?.id || null);
    };
    fetch();
  }, [user, condominioId]);

  useEffect(() => {
    if (!prestadorId || !condominioId) return;
    const fetchLancamentos = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("financeiro_lancamentos")
        .select("id, descricao, tipo, valor, status, vencimento, created_at")
        .eq("condominio_id", condominioId)
        .eq("prestador_id", prestadorId)
        .order("created_at", { ascending: false });
      setLancamentos((data as Lancamento[]) || []);
      setLoading(false);
    };
    fetchLancamentos();
  }, [prestadorId, condominioId]);

  const filteredLancamentos = useMemo(() => {
    let filtered = lancamentos;

    if (filtroStatus !== "todos") {
      filtered = filtered.filter((l) => l.status === filtroStatus);
    }

    if (filtroPeriodo !== "todos") {
      const now = new Date();
      const start = new Date();
      if (filtroPeriodo === "7d") start.setDate(now.getDate() - 7);
      else if (filtroPeriodo === "30d") start.setDate(now.getDate() - 30);
      else if (filtroPeriodo === "90d") start.setDate(now.getDate() - 90);
      filtered = filtered.filter((l) => new Date(l.created_at) >= start);
    }

    return filtered;
  }, [lancamentos, filtroStatus, filtroPeriodo]);

  const receber = filteredLancamentos.filter((l) => l.tipo === "receita");
  const pagar = filteredLancamentos.filter((l) => l.tipo === "despesa");

  const totalReceber = receber.filter((l) => l.status === "pendente").reduce((s, l) => s + Number(l.valor), 0);
  const totalPagar = pagar.filter((l) => l.status === "pendente").reduce((s, l) => s + Number(l.valor), 0);
  const totalRecebido = receber.filter((l) => l.status === "pago").reduce((s, l) => s + Number(l.valor), 0);
  const totalPagoVal = pagar.filter((l) => l.status === "pago").reduce((s, l) => s + Number(l.valor), 0);
  const saldo = totalRecebido - totalPagoVal;

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const renderList = (items: Lancamento[], emptyMsg: string, isReceita: boolean) => {
    if (!prestadorId) {
      return <p className="text-[13px] text-muted-foreground text-center py-8">Cadastro de prestador não encontrado.</p>;
    }
    if (loading) {
      return <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>;
    }
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-12">
          {isReceita ? <ArrowDownCircle size={40} className="text-muted-foreground" /> : <ArrowUpCircle size={40} className="text-muted-foreground" />}
          <p className="text-[14px] text-muted-foreground">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {items.map((l) => {
          const isVencido = l.status === "pendente" && l.vencimento && new Date(l.vencimento) < new Date();
          return (
            <Card key={l.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isReceita ? "bg-success/10" : "bg-destructive/10"}`}>
                  {isReceita ? <ArrowDownCircle size={18} className="text-success" /> : <ArrowUpCircle size={18} className="text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {l.descricao || (isReceita ? "Receita" : "Despesa")}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-muted-foreground">
                      {l.vencimento
                        ? `Venc: ${new Date(l.vencimento).toLocaleDateString("pt-BR")}`
                        : new Date(l.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    {isVencido && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
                        VENCIDO
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className={`text-[14px] font-bold ${isReceita ? "text-success" : "text-destructive"}`}>
                    {isReceita ? "+" : "-"} {formatCurrency(Number(l.valor))}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle[l.status] || "bg-muted text-muted-foreground"}`}>
                    {statusLabel[l.status] || l.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <PrestadorLayout title="Financeiro" showBack>
      <div className="flex flex-col gap-4">

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp size={16} className="text-success mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">A Receber</p>
              <p className="text-[14px] font-bold text-success mt-0.5">{formatCurrency(totalReceber)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingDown size={16} className="text-destructive mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">A Pagar</p>
              <p className="text-[14px] font-bold text-destructive mt-0.5">{formatCurrency(totalPagar)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <DollarSign size={16} className="text-primary mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Saldo</p>
              <p className={`text-[14px] font-bold mt-0.5 ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(saldo)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-success/5 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total Recebido</p>
            <p className="text-[13px] font-bold text-success">{formatCurrency(totalRecebido)}</p>
          </div>
          <div className="bg-destructive/5 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total Pago</p>
            <p className="text-[13px] font-bold text-destructive">{formatCurrency(totalPagoVal)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="h-9 flex-1 text-[12px]">
              <Filter size={14} className="mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger className="h-9 flex-1 text-[12px]">
              <Calendar size={14} className="mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo período</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="receber" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="receber" className="text-[12px]">
              A Receber ({receber.length})
            </TabsTrigger>
            <TabsTrigger value="pagar" className="text-[12px]">
              A Pagar ({pagar.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receber">
            {renderList(receber, "Nenhuma conta a receber", true)}
          </TabsContent>

          <TabsContent value="pagar">
            {renderList(pagar, "Nenhuma conta a pagar", false)}
          </TabsContent>
        </Tabs>
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorFinanceiro;

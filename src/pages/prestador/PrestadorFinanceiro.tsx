import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";

interface Lancamento {
  id: string;
  descricao: string | null;
  tipo: string;
  valor: number;
  status: string;
  vencimento: string | null;
  created_at: string;
}

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

  const totalPendente = lancamentos
    .filter((l) => l.status === "pendente")
    .reduce((s, l) => s + Number(l.valor), 0);

  const totalPago = lancamentos
    .filter((l) => l.status === "pago")
    .reduce((s, l) => s + Number(l.valor), 0);

  return (
    <PrestadorLayout>
      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-foreground">Financeiro</h2>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Pendente</p>
              <p className="text-[18px] font-bold text-warning mt-1">
                R$ {totalPendente.toFixed(2).replace(".", ",")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Recebido</p>
              <p className="text-[18px] font-bold text-success mt-1">
                R$ {totalPago.toFixed(2).replace(".", ",")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista */}
        {!prestadorId ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Cadastro de prestador não encontrado.</p>
        ) : loading ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
        ) : lancamentos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <DollarSign size={40} className="text-muted-foreground" />
            <p className="text-[14px] text-muted-foreground">Nenhum lançamento encontrado</p>
          </div>
        ) : (
          lancamentos.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {l.descricao || l.tipo}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {l.vencimento
                      ? new Date(l.vencimento).toLocaleDateString("pt-BR")
                      : new Date(l.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-[14px] font-bold text-foreground">
                    R$ {Number(l.valor).toFixed(2).replace(".", ",")}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle[l.status] || "bg-muted text-muted-foreground"}`}>
                    {l.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorFinanceiro;

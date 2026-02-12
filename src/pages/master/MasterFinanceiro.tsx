import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent } from "@/components/ui/card";

interface FinanceiroRow {
  condominioNome: string;
  receitaMensal: number;
  totalAcumulado: number;
}

const MasterFinanceiro = () => {
  const [rows, setRows] = useState<FinanceiroRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [lancRes, condRes] = await Promise.all([
        supabase.from("financeiro_lancamentos").select("condominio_id, valor, created_at"),
        supabase.from("condominios").select("id, nome"),
      ]);

      const lancamentos = lancRes.data || [];
      const conds = condRes.data || [];
      const condMap = new Map(conds.map((c) => [c.id, c.nome]));

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const grouped = new Map<string, { mensal: number; total: number }>();

      for (const l of lancamentos) {
        const entry = grouped.get(l.condominio_id) || { mensal: 0, total: 0 };
        const val = Number(l.valor);
        entry.total += val;
        const d = new Date(l.created_at);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          entry.mensal += val;
        }
        grouped.set(l.condominio_id, entry);
      }

      setRows(
        Array.from(grouped.entries()).map(([id, v]) => ({
          condominioNome: condMap.get(id) || "—",
          receitaMensal: v.mensal,
          totalAcumulado: v.total,
        }))
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <MasterLayout title="Financeiro">
      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum lançamento encontrado.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <Card key={i} className="rounded-[var(--radius-card)]">
              <CardContent className="p-4">
                <p className="font-semibold text-sm">{r.condominioNome}</p>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>Mensal: R$ {r.receitaMensal.toFixed(2)}</span>
                  <span>Acumulado: R$ {r.totalAcumulado.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MasterLayout>
  );
};

export default MasterFinanceiro;

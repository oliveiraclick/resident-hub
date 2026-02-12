import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Package, DollarSign } from "lucide-react";

interface Stats {
  mrr: number;
  totalCondominios: number;
  totalUsuarios: number;
  totalPacotesAtivos: number;
  ultimosCondominios: Array<{ id: string; nome: string; created_at: string }>;
}

const MasterHome = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [condominiosRes, rolesRes, pacotesRes, lancamentosRes] = await Promise.all([
        supabase.from("condominios").select("id, nome, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("id"),
        supabase.from("pacotes").select("id").in("status", ["RECEBIDO", "TRIADO"]),
        supabase.from("financeiro_lancamentos").select("valor"),
      ]);

      const condominios = condominiosRes.data || [];
      const mrr = (lancamentosRes.data || []).reduce((sum, l) => sum + Number(l.valor), 0);

      setStats({
        mrr,
        totalCondominios: condominios.length,
        totalUsuarios: (rolesRes.data || []).length,
        totalPacotesAtivos: (pacotesRes.data || []).length,
        ultimosCondominios: condominios.slice(0, 5),
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <MasterLayout title="Platform Admin">
        <p className="text-muted-foreground">Carregando...</p>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout title="Platform Admin">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="rounded-[var(--radius-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="text-primary" size={24} />
            <div>
              <p className="text-muted-foreground text-xs">MRR Total</p>
              <p className="text-lg font-bold">R$ {stats?.mrr.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[var(--radius-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="text-primary" size={24} />
            <div>
              <p className="text-muted-foreground text-xs">Condomínios</p>
              <p className="text-lg font-bold">{stats?.totalCondominios}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[var(--radius-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="text-primary" size={24} />
            <div>
              <p className="text-muted-foreground text-xs">Usuários</p>
              <p className="text-lg font-bold">{stats?.totalUsuarios}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[var(--radius-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="text-primary" size={24} />
            <div>
              <p className="text-muted-foreground text-xs">Pacotes Ativos</p>
              <p className="text-lg font-bold">{stats?.totalPacotesAtivos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[var(--radius-card)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Últimos Condomínios</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.ultimosCondominios.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum condomínio cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {stats?.ultimosCondominios.map((c) => (
                <div key={c.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                  <span className="text-sm font-medium">{c.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </MasterLayout>
  );
};

export default MasterHome;

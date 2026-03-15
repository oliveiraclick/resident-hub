import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Package, DollarSign, ShieldOff, Home, Wrench, Newspaper } from "lucide-react";

interface CategoriaCount {
  especialidade: string;
  total: number;
}

interface Stats {
  mrr: number;
  totalCondominios: number;
  totalUsuarios: number;
  totalPacotesAtivos: number;
  totalBloqueados: number;
  totalMoradores: number;
  totalPrestadores: number;
  ultimosCondominios: Array<{ id: string; nome: string; created_at: string }>;
  categoriaCounts: CategoriaCount[];
}

const MasterHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [condominiosRes, rolesRes, pacotesRes, lancamentosRes, bloqueadosRes, moradoresRes, prestadoresRes, prestadoresAllRes] = await Promise.all([
        supabase.from("condominios").select("id, nome, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("id"),
        supabase.from("pacotes").select("id").in("status", ["RECEBIDO", "TRIADO"]),
        supabase.from("financeiro_lancamentos").select("valor"),
        supabase.from("user_roles").select("id").eq("aprovado", false),
        supabase.from("user_roles").select("id").eq("role", "morador"),
        supabase.from("user_roles").select("id").eq("role", "prestador"),
        supabase.from("prestadores").select("especialidade"),
      ]);

      const condominios = condominiosRes.data || [];
      const mrr = (lancamentosRes.data || []).reduce((sum, l) => sum + Number(l.valor), 0);

      // Count by especialidade
      const countMap: Record<string, number> = {};
      (prestadoresAllRes.data || []).forEach((p) => {
        const esp = p.especialidade || "Outros";
        countMap[esp] = (countMap[esp] || 0) + 1;
      });
      const categoriaCounts = Object.entries(countMap)
        .map(([especialidade, total]) => ({ especialidade, total }))
        .sort((a, b) => b.total - a.total);

      setStats({
        mrr,
        totalCondominios: condominios.length,
        totalUsuarios: (rolesRes.data || []).length,
        totalPacotesAtivos: (pacotesRes.data || []).length,
        totalBloqueados: (bloqueadosRes.data || []).length,
        totalMoradores: (moradoresRes.data || []).length,
        totalPrestadores: (prestadoresRes.data || []).length,
        ultimosCondominios: condominios.slice(0, 5),
        categoriaCounts,
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
              <p className="text-lg font-bold">R$ {formatBRL(stats?.mrr ?? 0)}</p>
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

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="rounded-[var(--radius-card)] cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/master/usuarios?filter=bloqueados")}>
          <CardContent className="p-4 flex flex-col items-center gap-1 text-center">
            <ShieldOff className="text-destructive" size={22} />
            <p className="text-muted-foreground text-[10px]">Bloqueados</p>
            <p className="text-lg font-bold">{stats?.totalBloqueados}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[var(--radius-card)] cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/master/usuarios?filter=morador")}>
          <CardContent className="p-4 flex flex-col items-center gap-1 text-center">
            <Home className="text-primary" size={22} />
            <p className="text-muted-foreground text-[10px]">Moradores</p>
            <p className="text-lg font-bold">{stats?.totalMoradores}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[var(--radius-card)] cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/master/usuarios?filter=prestador")}>
          <CardContent className="p-4 flex flex-col items-center gap-1 text-center">
            <Wrench className="text-primary" size={22} />
            <p className="text-muted-foreground text-[10px]">Prestadores</p>
            <p className="text-lg font-bold">{stats?.totalPrestadores}</p>
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

      {stats?.categoriaCounts && stats.categoriaCounts.length > 0 && (
        <Card className="rounded-[var(--radius-card)] mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Prestadores por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border pointer-events-none" />
              {stats.categoriaCounts.map((cat) => (
                <div
                  key={cat.especialidade}
                  className="flex justify-between items-center border-b border-border pb-2 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                  onClick={() => navigate(`/master/usuarios?filter=prestador&categoria=${encodeURIComponent(cat.especialidade)}`)}
                >
                  <span className="text-sm font-medium">{cat.especialidade}</span>
                  <span className="text-xs font-semibold text-primary">{cat.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </MasterLayout>
  );
};

export default MasterHome;

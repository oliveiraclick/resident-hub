import { useEffect, useState } from "react";
import MasterLayout from "@/components/MasterLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity, Eye, AlertTriangle, Server, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
}

interface PageView {
  id: string;
  user_id: string | null;
  page: string;
  module: string | null;
  created_at: string;
}

interface ErrorLog {
  id: string;
  user_id: string | null;
  message: string;
  stack: string | null;
  url: string | null;
  context: any;
  created_at: string;
}

interface FunctionLog {
  id: string;
  function_name: string;
  status: string;
  duration_ms: number | null;
  error: string | null;
  details: any;
  created_at: string;
}

const MasterObservabilidade = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [functions, setFunctions] = useState<FunctionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("all");

  const filterByPeriod = <T extends { created_at: string }>(items: T[]): T[] => {
    if (period === "all") return items;
    const days = period === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return items.filter((i) => new Date(i.created_at) >= cutoff);
  };

  const filteredActivities = filterByPeriod(activities);
  const filteredPageViews = filterByPeriod(pageViews);
  const filteredErrors = filterByPeriod(errors);
  const filteredFunctions = filterByPeriod(functions);

  const fetchAll = async () => {
    setLoading(true);
    const [a, p, e, f] = await Promise.all([
      supabase.from("activity_logs" as any).select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("page_views" as any).select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("error_logs" as any).select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("function_logs" as any).select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setActivities((a.data as unknown as ActivityLog[]) || []);
    setPageViews((p.data as unknown as PageView[]) || []);
    setErrors((e.data as unknown as ErrorLog[]) || []);
    setFunctions((f.data as unknown as FunctionLog[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const clearTable = async (table: string) => {
    await supabase.from(table as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    toast.success("Dados limpos");
    fetchAll();
  };

  // Module usage stats
  const moduleStats = filteredPageViews.reduce<Record<string, number>>((acc, pv) => {
    const m = pv.module || "outro";
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});

  // Top pages
  const pageStats = filteredPageViews.reduce<Record<string, number>>((acc, pv) => {
    acc[pv.page] = (acc[pv.page] || 0) + 1;
    return acc;
  }, {});
  const topPages = Object.entries(pageStats).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Function stats
  const fnStats = filteredFunctions.reduce<Record<string, { total: number; errors: number; avgMs: number }>>((acc, fl) => {
    if (!acc[fl.function_name]) acc[fl.function_name] = { total: 0, errors: 0, avgMs: 0 };
    acc[fl.function_name].total++;
    if (fl.status !== "success") acc[fl.function_name].errors++;
    if (fl.duration_ms) acc[fl.function_name].avgMs += fl.duration_ms;
    return acc;
  }, {});
  Object.values(fnStats).forEach(s => { if (s.total > 0) s.avgMs = Math.round(s.avgMs / s.total); });

  const translateError = (msg: string) => {
    const translations: Record<string, string> = {
      "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.":
        "Falha ao remover elemento do DOM: o nó a ser removido não é filho deste nó. (Geralmente causado por extensões do navegador)",
      "Failed to fetch": "Falha na requisição de rede",
      "NetworkError": "Erro de rede",
      "Load failed": "Falha ao carregar",
      "Script error.": "Erro de script (origem externa)",
      "ResizeObserver loop completed with undelivered notifications.":
        "Loop do ResizeObserver com notificações não entregues (inofensivo)",
    };
    for (const [en, pt] of Object.entries(translations)) {
      if (msg.includes(en)) return msg.replace(en, pt);
    }
    return msg;
  };

  const fmt = (d: string) => new Date(d).toLocaleString("pt-BR");

  return (
    <MasterLayout title="Observabilidade">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">📊 Observabilidade do Sistema</h2>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw size={14} className={`mr-1 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-muted-foreground">Período:</span>
        {(["7d", "30d", "all"] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setPeriod(p)}
          >
            {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "Tudo"}
          </Button>
        ))}
      </div>

      {/* Overview Cards - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all" onClick={() => setTab("activities")}>
          <CardContent className="p-4 text-center">
            <Activity size={24} className="mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{filteredActivities.length}</p>
            <p className="text-xs text-muted-foreground">Ações</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-blue-500/30 transition-all" onClick={() => setTab("overview")}>
          <CardContent className="p-4 text-center">
            <Eye size={24} className="mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{filteredPageViews.length}</p>
            <p className="text-xs text-muted-foreground">Visualizações</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-destructive/30 transition-all" onClick={() => setTab("errors")}>
          <CardContent className="p-4 text-center">
            <AlertTriangle size={24} className="mx-auto text-destructive mb-1" />
            <p className="text-2xl font-bold">{filteredErrors.length}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-green-500/30 transition-all" onClick={() => setTab("functions")}>
          <CardContent className="p-4 text-center">
            <Server size={24} className="mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{filteredFunctions.length}</p>
            <p className="text-xs text-muted-foreground">Funções</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Uso</TabsTrigger>
          <TabsTrigger value="activities">Ações</TabsTrigger>
          <TabsTrigger value="errors">Erros</TabsTrigger>
          <TabsTrigger value="functions">Funções</TabsTrigger>
        </TabsList>

        {/* Usage Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Uso por Módulo</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => clearTable("page_views")}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(moduleStats).sort((a, b) => b[1] - a[1]).map(([mod, count]) => (
                  <div key={mod} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{mod}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, (count / Math.max(...Object.values(moduleStats))) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top 10 Páginas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {topPages.map(([page, count]) => (
                  <div key={page} className="flex items-center justify-between text-xs">
                    <span className="truncate flex-1 mr-2 text-muted-foreground">{page}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {topPages.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma visualização registrada</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-2">
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={() => clearTable("activity_logs")}>
              <Trash2 size={14} className="mr-1" /> Limpar
            </Button>
          </div>
          {filteredActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ação registrada</p>
          ) : filteredActivities.slice(0, 50).map(a => (
            <Card key={a.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {a.action}
                  </span>
                  {a.entity_type && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {a.entity_type}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{fmt(a.created_at)}</span>
                </div>
                {a.entity_id && <p className="text-[11px] text-muted-foreground mt-1">ID: {a.entity_id}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-2">
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={() => clearTable("error_logs")}>
              <Trash2 size={14} className="mr-1" /> Limpar
            </Button>
          </div>
          {filteredErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum erro registrado 🎉</p>
          ) : filteredErrors.slice(0, 50).map(e => (
            <Card key={e.id}>
              <CardContent className="p-3">
                <p className="text-sm text-destructive font-medium">❌ {e.message}</p>
                {e.url && <p className="text-[11px] text-muted-foreground mt-1 truncate">{e.url}</p>}
                {e.stack && (
                  <details className="mt-1">
                    <summary className="text-[10px] text-muted-foreground cursor-pointer">Rastreamento de erro</summary>
                    <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap break-all max-h-32 overflow-auto">{e.stack}</pre>
                  </details>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">{fmt(e.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Functions Tab */}
        <TabsContent value="functions" className="space-y-4">
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={() => clearTable("function_logs")}>
              <Trash2 size={14} className="mr-1" /> Limpar
            </Button>
          </div>

          {Object.keys(fnStats).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Resumo por Função</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(fnStats).map(([name, stats]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{stats.total} execuções</span>
                        <span className={stats.errors > 0 ? "text-destructive" : "text-green-500"}>
                          {stats.errors} erros
                        </span>
                        <span>{stats.avgMs}ms média</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredFunctions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum log de função registrado</p>
          ) : filteredFunctions.slice(0, 50).map(f => (
            <Card key={f.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    f.status === "success" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                  }`}>
                    {f.status === "success" ? "sucesso" : f.status}
                  </span>
                  <span className="text-sm font-medium">{f.function_name}</span>
                  {f.duration_ms && <span className="text-xs text-muted-foreground ml-auto">{f.duration_ms}ms</span>}
                </div>
                {f.error && <p className="text-xs text-destructive mt-1">❌ {f.error}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{fmt(f.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </MasterLayout>
  );
};

export default MasterObservabilidade;

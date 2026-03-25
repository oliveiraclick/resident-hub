import { useState, useMemo } from "react";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { Activity, Server, Users, Copy, RefreshCw, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// ─── Simulation Parameters ───
interface SimParams {
  users: number;
  months: number;
  simulations: number;
  avgRequestsPerUserPerDay: number;
  dbMaxConnections: number;
  avgLatencyMs: number;
  failureRatePct: number;
  maintenanceHoursPerMonth: number;
}

const DEFAULT_PARAMS: SimParams = {
  users: 1500,
  months: 6,
  simulations: 5000,
  avgRequestsPerUserPerDay: 15,
  dbMaxConnections: 60, // Supabase free tier
  avgLatencyMs: 120,
  failureRatePct: 0.5,
  maintenanceHoursPerMonth: 1,
};

// ─── Monte Carlo Engine ───
function runSimulation(params: SimParams) {
  const {
    users, months, simulations, avgRequestsPerUserPerDay,
    dbMaxConnections, avgLatencyMs, failureRatePct, maintenanceHoursPerMonth,
  } = params;

  const totalHoursInPeriod = months * 30 * 24;
  const peakConcurrentPct = 0.08; // ~8% online at peak

  const uptimeResults: number[] = [];
  const peakRpsResults: number[] = [];
  const latencyP95Results: number[] = [];
  const monthlyData: Array<{ month: string; avgUptime: number; avgRps: number; p5Uptime: number; p95Uptime: number }> = [];

  // Per-month breakdown
  for (let m = 1; m <= months; m++) {
    const monthUptimes: number[] = [];
    const monthRps: number[] = [];

    for (let s = 0; s < Math.min(simulations, 1000); s++) {
      // Random growth factor (users grow ~5-15% per month)
      const growthMultiplier = 1 + (m - 1) * (0.05 + Math.random() * 0.10);
      const currentUsers = Math.round(users * growthMultiplier);

      // Random failure events (exponential distribution)
      const failureEvents = Math.floor(-Math.log(1 - Math.random()) / (failureRatePct / 100) * 0.5);
      const failureHours = failureEvents * (0.5 + Math.random() * 2); // 30min to 2.5h each

      // Maintenance downtime
      const maint = maintenanceHoursPerMonth * (0.8 + Math.random() * 0.4);

      const monthHours = 30 * 24;
      const downtime = Math.min(failureHours + maint, monthHours);
      const uptime = ((monthHours - downtime) / monthHours) * 100;
      monthUptimes.push(uptime);

      // Peak concurrent users with random spike
      const peakUsers = currentUsers * peakConcurrentPct * (1 + Math.random() * 0.5);
      const rps = (peakUsers * avgRequestsPerUserPerDay) / (12 * 3600); // spread over 12 active hours
      monthRps.push(rps);
    }

    monthUptimes.sort((a, b) => a - b);
    monthRps.sort((a, b) => a - b);

    monthlyData.push({
      month: `Mês ${m}`,
      avgUptime: Number((monthUptimes.reduce((a, b) => a + b, 0) / monthUptimes.length).toFixed(3)),
      avgRps: Number((monthRps.reduce((a, b) => a + b, 0) / monthRps.length).toFixed(1)),
      p5Uptime: Number(monthUptimes[Math.floor(monthUptimes.length * 0.05)].toFixed(3)),
      p95Uptime: Number(monthUptimes[Math.floor(monthUptimes.length * 0.95)].toFixed(3)),
    });
  }

  // Full period simulation
  for (let s = 0; s < simulations; s++) {
    let totalDownHours = 0;
    let maxRps = 0;
    let worstLatency = avgLatencyMs;

    for (let m = 0; m < months; m++) {
      const growthMultiplier = 1 + m * (0.05 + Math.random() * 0.10);
      const currentUsers = Math.round(users * growthMultiplier);

      // Failures
      const failureEvents = Math.floor(-Math.log(1 - Math.random()) / (failureRatePct / 100) * 0.5);
      totalDownHours += failureEvents * (0.5 + Math.random() * 2);
      totalDownHours += maintenanceHoursPerMonth * (0.8 + Math.random() * 0.4);

      // Peak load
      const peakUsers = currentUsers * peakConcurrentPct * (1 + Math.random() * 0.5);
      const rps = (peakUsers * avgRequestsPerUserPerDay) / (12 * 3600);
      maxRps = Math.max(maxRps, rps);

      // Latency under load (degrades as connections approach limit)
      const connUsage = (peakUsers * 0.1) / dbMaxConnections;
      const latencyMultiplier = connUsage > 0.8 ? 1 + (connUsage - 0.8) * 10 : 1;
      worstLatency = Math.max(worstLatency, avgLatencyMs * latencyMultiplier * (0.8 + Math.random() * 0.4));
    }

    totalDownHours = Math.min(totalDownHours, totalHoursInPeriod);
    const uptime = ((totalHoursInPeriod - totalDownHours) / totalHoursInPeriod) * 100;
    uptimeResults.push(uptime);
    peakRpsResults.push(maxRps);
    latencyP95Results.push(worstLatency);
  }

  // Sort results
  uptimeResults.sort((a, b) => a - b);
  peakRpsResults.sort((a, b) => a - b);
  latencyP95Results.sort((a, b) => a - b);

  // Distribution histogram for uptime
  const uptimeHist: Array<{ range: string; count: number }> = [];
  const buckets = [99.0, 99.5, 99.8, 99.9, 99.95, 100.01];
  for (let i = 0; i < buckets.length - 1; i++) {
    const lo = i === 0 ? 95 : buckets[i - 1] || 95;
    const hi = buckets[i];
    const count = uptimeResults.filter(u => u >= lo && u < hi).length;
    uptimeHist.push({ range: `${lo < 99 ? "<99" : lo.toFixed(1)}%`, count });
  }
  uptimeHist.push({
    range: "≥99.95%",
    count: uptimeResults.filter(u => u >= 99.95).length,
  });

  const percentile = (arr: number[], p: number) => arr[Math.floor(arr.length * p / 100)];

  return {
    uptime: {
      mean: Number((uptimeResults.reduce((a, b) => a + b, 0) / simulations).toFixed(4)),
      p5: Number(percentile(uptimeResults, 5).toFixed(4)),
      p50: Number(percentile(uptimeResults, 50).toFixed(4)),
      p95: Number(percentile(uptimeResults, 95).toFixed(4)),
      min: Number(uptimeResults[0].toFixed(4)),
      max: Number(uptimeResults[simulations - 1].toFixed(4)),
    },
    peakRps: {
      mean: Number((peakRpsResults.reduce((a, b) => a + b, 0) / simulations).toFixed(1)),
      p95: Number(percentile(peakRpsResults, 95).toFixed(1)),
      max: Number(peakRpsResults[simulations - 1].toFixed(1)),
    },
    latencyP95: {
      mean: Number((latencyP95Results.reduce((a, b) => a + b, 0) / simulations).toFixed(0)),
      p95: Number(percentile(latencyP95Results, 95).toFixed(0)),
      max: Number(latencyP95Results[simulations - 1].toFixed(0)),
    },
    dbConnectionUsage: {
      peakPct: Number(((users * peakConcurrentPct * 0.1) / dbMaxConnections * 100).toFixed(1)),
    },
    monthlyData,
    uptimeHist,
  };
}

// ─── Component ───
const MasterSimulacao = () => {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [running, setRunning] = useState(false);

  const results = useMemo(() => {
    setRunning(true);
    const r = runSimulation(params);
    setRunning(false);
    return r;
  }, [params]);

  const handleCopyData = () => {
    const text = JSON.stringify({ params, results }, null, 2);
    navigator.clipboard.writeText(text);
    toast.success("Dados copiados para a área de transferência");
  };

  const uptimeColor = results.uptime.mean >= 99.9 ? "text-primary" : results.uptime.mean >= 99.5 ? "text-warning" : "text-destructive";
  const connColor = results.dbConnectionUsage.peakPct < 60 ? "text-primary" : results.dbConnectionUsage.peakPct < 80 ? "text-warning" : "text-destructive";

  return (
    <MasterLayout title="Simulação Monte Carlo">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Parameters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Parâmetros da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Usuários</label>
                <Input
                  type="number"
                  value={params.users}
                  onChange={(e) => setParams(p => ({ ...p, users: Number(e.target.value) || 100 }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Meses</label>
                <Input
                  type="number"
                  value={params.months}
                  onChange={(e) => setParams(p => ({ ...p, months: Math.min(24, Number(e.target.value) || 1) }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Simulações</label>
                <Input
                  type="number"
                  value={params.simulations}
                  onChange={(e) => setParams(p => ({ ...p, simulations: Math.min(10000, Number(e.target.value) || 100) }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Req/usuário/dia</label>
                <Input
                  type="number"
                  value={params.avgRequestsPerUserPerDay}
                  onChange={(e) => setParams(p => ({ ...p, avgRequestsPerUserPerDay: Number(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Taxa de falha (%): {params.failureRatePct}%</label>
              <Slider
                value={[params.failureRatePct]}
                min={0.1}
                max={5}
                step={0.1}
                onValueChange={([v]) => setParams(p => ({ ...p, failureRatePct: v }))}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setParams(DEFAULT_PARAMS)}>
                <RefreshCw size={14} className="mr-1" /> Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyData}>
                <Copy size={14} className="mr-1" /> Exportar dados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Server size={20} className={`mx-auto mb-1 ${uptimeColor}`} />
              <p className={`text-xl font-bold ${uptimeColor}`}>{results.uptime.mean}%</p>
              <p className="text-[10px] text-muted-foreground">Uptime Médio</p>
              <p className="text-[9px] text-muted-foreground">P5: {results.uptime.p5}% · P95: {results.uptime.p95}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp size={20} className="mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold text-foreground">{results.peakRps.p95}</p>
              <p className="text-[10px] text-muted-foreground">Peak req/s (P95)</p>
              <p className="text-[9px] text-muted-foreground">Máx: {results.peakRps.max} req/s</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity size={20} className="mx-auto mb-1 text-accent" />
              <p className="text-xl font-bold text-foreground">{results.latencyP95.mean}ms</p>
              <p className="text-[10px] text-muted-foreground">Latência P95 Média</p>
              <p className="text-[9px] text-muted-foreground">Pior caso: {results.latencyP95.max}ms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users size={20} className={`mx-auto mb-1 ${connColor}`} />
              <p className={`text-xl font-bold ${connColor}`}>{results.dbConnectionUsage.peakPct}%</p>
              <p className="text-[10px] text-muted-foreground">Uso de Conexões DB</p>
              <p className="text-[9px] text-muted-foreground">{params.dbMaxConnections} conexões máx</p>
            </CardContent>
          </Card>
        </div>

        {/* Verdict */}
        <Card className={results.uptime.mean >= 99.5 ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}>
          <CardContent className="p-4 flex items-start gap-3">
            {results.uptime.mean >= 99.5 ? (
              <CheckCircle size={24} className="text-primary flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={24} className="text-destructive flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {results.uptime.mean >= 99.9
                  ? "🟢 Excelente — Sistema altamente disponível"
                  : results.uptime.mean >= 99.5
                  ? "🟡 Bom — Disponibilidade adequada"
                  : "🔴 Atenção — Considere upgrade de infraestrutura"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Com {params.users} usuários em {params.months} meses e {params.simulations} simulações,
                o sistema tem <strong>{results.uptime.mean}%</strong> de disponibilidade média.
                {results.dbConnectionUsage.peakPct > 70
                  ? " ⚠️ O uso de conexões do banco está alto — considere otimizar queries ou fazer upgrade."
                  : " As conexões do banco estão dentro do limite seguro."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Uptime Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Disponibilidade por Mês (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={results.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[98, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="p95Uptime" name="P95" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                <Area type="monotone" dataKey="avgUptime" name="Média" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <Area type="monotone" dataKey="p5Uptime" name="P5 (pior)" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak RPS by Month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Requisições/segundo no Pico (por mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={results.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="avgRps" name="Req/s médio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Uptime Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuição do Uptime ({params.simulations} simulações)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={results.uptimeHist}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" name="Simulações" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pb-4">
          Simulação Monte Carlo · Modelo estocástico com crescimento de usuários, falhas aleatórias e degradação de latência sob carga.
          Os resultados são estimativas baseadas em distribuições probabilísticas.
        </p>
      </div>
    </MasterLayout>
  );
};

export default MasterSimulacao;

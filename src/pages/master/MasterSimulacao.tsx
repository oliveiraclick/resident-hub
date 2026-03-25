import { useState, useMemo } from "react";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, LineChart, Line, ReferenceLine } from "recharts";
import { Activity, Server, Users, Copy, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Skull, Zap } from "lucide-react";
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
  dbMaxConnections: 60,
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
  const peakConcurrentPct = 0.08;

  const uptimeResults: number[] = [];
  const peakRpsResults: number[] = [];
  const latencyP95Results: number[] = [];
  const monthlyData: Array<{ month: string; avgUptime: number; avgRps: number; p5Uptime: number; p95Uptime: number; usersProjected: number; connUsagePct: number; avgLatency: number }> = [];

  for (let m = 1; m <= months; m++) {
    const monthUptimes: number[] = [];
    const monthRps: number[] = [];
    const monthLatencies: number[] = [];

    const growthBase = 1 + (m - 1) * 0.10;
    const projectedUsers = Math.round(users * growthBase);

    for (let s = 0; s < Math.min(simulations, 1000); s++) {
      const growthMultiplier = 1 + (m - 1) * (0.05 + Math.random() * 0.10);
      const currentUsers = Math.round(users * growthMultiplier);

      const failureEvents = Math.floor(-Math.log(1 - Math.random()) / (failureRatePct / 100) * 0.5);
      const failureHours = failureEvents * (0.5 + Math.random() * 2);
      const maint = maintenanceHoursPerMonth * (0.8 + Math.random() * 0.4);

      const monthHours = 30 * 24;
      const downtime = Math.min(failureHours + maint, monthHours);
      const uptime = ((monthHours - downtime) / monthHours) * 100;
      monthUptimes.push(uptime);

      const peakUsers = currentUsers * peakConcurrentPct * (1 + Math.random() * 0.5);
      const rps = (peakUsers * avgRequestsPerUserPerDay) / (12 * 3600);
      monthRps.push(rps);

      const connUsage = (peakUsers * 0.1) / dbMaxConnections;
      const latencyMultiplier = connUsage > 0.8 ? 1 + (connUsage - 0.8) * 10 : connUsage > 0.6 ? 1 + (connUsage - 0.6) * 3 : 1;
      monthLatencies.push(avgLatencyMs * latencyMultiplier * (0.8 + Math.random() * 0.4));
    }

    monthUptimes.sort((a, b) => a - b);
    monthRps.sort((a, b) => a - b);

    const peakUsersEst = projectedUsers * peakConcurrentPct * 1.25;
    const connPct = (peakUsersEst * 0.1) / dbMaxConnections * 100;

    monthlyData.push({
      month: `Mês ${m}`,
      avgUptime: Number((monthUptimes.reduce((a, b) => a + b, 0) / monthUptimes.length).toFixed(3)),
      avgRps: Number((monthRps.reduce((a, b) => a + b, 0) / monthRps.length).toFixed(1)),
      p5Uptime: Number(monthUptimes[Math.floor(monthUptimes.length * 0.05)].toFixed(3)),
      p95Uptime: Number(monthUptimes[Math.floor(monthUptimes.length * 0.95)].toFixed(3)),
      usersProjected: projectedUsers,
      connUsagePct: Number(connPct.toFixed(1)),
      avgLatency: Number((monthLatencies.reduce((a, b) => a + b, 0) / monthLatencies.length).toFixed(0)),
    });
  }

  for (let s = 0; s < simulations; s++) {
    let totalDownHours = 0;
    let maxRps = 0;
    let worstLatency = avgLatencyMs;

    for (let m = 0; m < months; m++) {
      const growthMultiplier = 1 + m * (0.05 + Math.random() * 0.10);
      const currentUsers = Math.round(users * growthMultiplier);
      const failureEvents = Math.floor(-Math.log(1 - Math.random()) / (failureRatePct / 100) * 0.5);
      totalDownHours += failureEvents * (0.5 + Math.random() * 2);
      totalDownHours += maintenanceHoursPerMonth * (0.8 + Math.random() * 0.4);

      const peakUsers = currentUsers * peakConcurrentPct * (1 + Math.random() * 0.5);
      const rps = (peakUsers * avgRequestsPerUserPerDay) / (12 * 3600);
      maxRps = Math.max(maxRps, rps);

      const connUsage = (peakUsers * 0.1) / dbMaxConnections;
      const latencyMultiplier = connUsage > 0.8 ? 1 + (connUsage - 0.8) * 10 : 1;
      worstLatency = Math.max(worstLatency, avgLatencyMs * latencyMultiplier * (0.8 + Math.random() * 0.4));
    }

    totalDownHours = Math.min(totalDownHours, totalHoursInPeriod);
    uptimeResults.push(((totalHoursInPeriod - totalDownHours) / totalHoursInPeriod) * 100);
    peakRpsResults.push(maxRps);
    latencyP95Results.push(worstLatency);
  }

  uptimeResults.sort((a, b) => a - b);
  peakRpsResults.sort((a, b) => a - b);
  latencyP95Results.sort((a, b) => a - b);

  const uptimeHist: Array<{ range: string; count: number }> = [];
  const buckets = [99.0, 99.5, 99.8, 99.9, 99.95, 100.01];
  for (let i = 0; i < buckets.length - 1; i++) {
    const lo = i === 0 ? 95 : buckets[i - 1] || 95;
    const hi = buckets[i];
    uptimeHist.push({ range: `${lo < 99 ? "<99" : lo.toFixed(1)}%`, count: uptimeResults.filter(u => u >= lo && u < hi).length });
  }
  uptimeHist.push({ range: "≥99.95%", count: uptimeResults.filter(u => u >= 99.95).length });

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

// ─── Collapse Finder ───
function findCollapsePoint(baseParams: SimParams) {
  const steps: Array<{ users: number; uptime: number; connPct: number; latency: number; rps: number; status: string }> = [];
  
  for (let multiplier = 1; multiplier <= 20; multiplier++) {
    const testUsers = Math.round(baseParams.users * multiplier * 0.5);
    const peakConcurrentPct = 0.08;
    const peakUsers = testUsers * peakConcurrentPct * 1.25;
    const connPct = (peakUsers * 0.1) / baseParams.dbMaxConnections * 100;
    const rps = (peakUsers * baseParams.avgRequestsPerUserPerDay) / (12 * 3600);
    
    const connUsage = connPct / 100;
    const latencyMultiplier = connUsage > 1.0 ? 1 + (connUsage - 0.5) * 20 : connUsage > 0.8 ? 1 + (connUsage - 0.8) * 10 : connUsage > 0.6 ? 1 + (connUsage - 0.6) * 3 : 1;
    const latency = Math.round(baseParams.avgLatencyMs * latencyMultiplier);

    // Uptime degrades with overloaded connections
    let uptime = 99.95;
    if (connPct > 100) uptime = Math.max(80, 99.95 - (connPct - 100) * 0.5);
    else if (connPct > 80) uptime = 99.95 - (connPct - 80) * 0.05;

    const status = connPct >= 100 ? "🔴 COLAPSO" : connPct >= 80 ? "🟡 CRÍTICO" : connPct >= 60 ? "🟠 ALERTA" : "🟢 OK";

    steps.push({
      users: testUsers,
      uptime: Number(uptime.toFixed(2)),
      connPct: Number(connPct.toFixed(1)),
      latency,
      rps: Number(rps.toFixed(1)),
      status,
    });

    if (connPct >= 150) break;
  }

  return steps;
}

// ─── Stress Test over Time ───
function stressOverTime(baseParams: SimParams) {
  const data: Array<{ hora: string; onlineUsers: number; connPct: number; latency: number; rps: number }> = [];
  const peakConcurrentPct = 0.08;

  // Simulate 24 hours with varying load
  const hourlyLoadProfile = [
    0.02, 0.01, 0.01, 0.01, 0.01, 0.02, // 00-05: low
    0.04, 0.06, 0.08, 0.07, 0.06, 0.07, // 06-11: morning
    0.08, 0.06, 0.05, 0.05, 0.06, 0.07, // 12-17: afternoon
    0.09, 0.10, 0.10, 0.08, 0.05, 0.03, // 18-23: evening peak
  ];

  for (let h = 0; h < 24; h++) {
    const loadFactor = hourlyLoadProfile[h];
    const onlineUsers = Math.round(baseParams.users * loadFactor * (1 + Math.random() * 0.3));
    const connUsage = (onlineUsers * 0.1) / baseParams.dbMaxConnections;
    const connPct = Number((connUsage * 100).toFixed(1));
    const latencyMult = connUsage > 0.8 ? 1 + (connUsage - 0.8) * 10 : connUsage > 0.6 ? 1 + (connUsage - 0.6) * 3 : 1;
    const latency = Math.round(baseParams.avgLatencyMs * latencyMult);
    const rps = Number(((onlineUsers * baseParams.avgRequestsPerUserPerDay) / 3600).toFixed(1));

    data.push({
      hora: `${String(h).padStart(2, "0")}:00`,
      onlineUsers,
      connPct,
      latency,
      rps,
    });
  }

  return data;
}

// ─── Component ───
const MasterSimulacao = () => {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);

  const results = useMemo(() => runSimulation(params), [params]);
  const collapseData = useMemo(() => findCollapsePoint(params), [params]);
  const hourlyData = useMemo(() => stressOverTime(params), [params]);

  const collapsePoint = collapseData.find(d => d.connPct >= 100);
  const criticalPoint = collapseData.find(d => d.connPct >= 80);

  const handleCopyData = () => {
    const text = JSON.stringify({ params, results, collapseData, hourlyData }, null, 2);
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
                <label className="text-xs text-muted-foreground">Usuários totais</label>
                <Input type="number" value={params.users} onChange={(e) => setParams(p => ({ ...p, users: Number(e.target.value) || 100 }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Período (meses)</label>
                <Input type="number" value={params.months} onChange={(e) => setParams(p => ({ ...p, months: Math.min(36, Number(e.target.value) || 1) }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Simulações</label>
                <Input type="number" value={params.simulations} onChange={(e) => setParams(p => ({ ...p, simulations: Math.min(10000, Number(e.target.value) || 100) }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Req/usuário/dia</label>
                <Input type="number" value={params.avgRequestsPerUserPerDay} onChange={(e) => setParams(p => ({ ...p, avgRequestsPerUserPerDay: Number(e.target.value) || 1 }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Conexões DB máx</label>
                <Input type="number" value={params.dbMaxConnections} onChange={(e) => setParams(p => ({ ...p, dbMaxConnections: Number(e.target.value) || 10 }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Latência base (ms)</label>
                <Input type="number" value={params.avgLatencyMs} onChange={(e) => setParams(p => ({ ...p, avgLatencyMs: Number(e.target.value) || 50 }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Taxa de falha: {params.failureRatePct}%</label>
              <Slider value={[params.failureRatePct]} min={0.1} max={5} step={0.1} onValueChange={([v]) => setParams(p => ({ ...p, failureRatePct: v }))} className="mt-2" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Manutenção/mês: {params.maintenanceHoursPerMonth}h</label>
              <Slider value={[params.maintenanceHoursPerMonth]} min={0} max={10} step={0.5} onValueChange={([v]) => setParams(p => ({ ...p, maintenanceHoursPerMonth: v }))} className="mt-2" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setParams(DEFAULT_PARAMS)}>
                <RefreshCw size={14} className="mr-1" /> Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyData}>
                <Copy size={14} className="mr-1" /> Exportar JSON
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
              <p className="text-[9px] text-muted-foreground">Pior: {results.latencyP95.max}ms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users size={20} className={`mx-auto mb-1 ${connColor}`} />
              <p className={`text-xl font-bold ${connColor}`}>{results.dbConnectionUsage.peakPct}%</p>
              <p className="text-[10px] text-muted-foreground">Uso Conexões DB</p>
              <p className="text-[9px] text-muted-foreground">{params.dbMaxConnections} conexões máx</p>
            </CardContent>
          </Card>
        </div>

        {/* Verdict */}
        <Card className={results.uptime.mean >= 99.5 ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}>
          <CardContent className="p-4 flex items-start gap-3">
            {results.uptime.mean >= 99.5 ? <CheckCircle size={24} className="text-primary flex-shrink-0 mt-0.5" /> : <AlertTriangle size={24} className="text-destructive flex-shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-sm">
                {results.uptime.mean >= 99.9 ? "🟢 Excelente — Sistema altamente disponível" : results.uptime.mean >= 99.5 ? "🟡 Bom — Disponibilidade adequada" : "🔴 Atenção — Considere upgrade de infraestrutura"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Com {params.users} usuários em {params.months} meses, o sistema tem <strong>{results.uptime.mean}%</strong> de disponibilidade média.
                {results.dbConnectionUsage.peakPct > 70 ? " ⚠️ Uso de conexões alto." : " Conexões dentro do limite."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ═══ COLLAPSE POINT ═══ */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Skull size={18} className="text-destructive" />
              Ponto de Colapso
            </CardTitle>
            <p className="text-xs text-muted-foreground">Quando o sistema começa a falhar com crescimento de usuários</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {collapsePoint ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                <p className="text-sm font-bold text-destructive">💥 Colapso em ~{collapsePoint.users.toLocaleString()} usuários</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
                  <p>Conexões DB: <strong className="text-destructive">{collapsePoint.connPct}%</strong></p>
                  <p>Latência: <strong className="text-destructive">{collapsePoint.latency}ms</strong></p>
                  <p>Uptime: <strong className="text-destructive">{collapsePoint.uptime}%</strong></p>
                  <p>Req/s pico: <strong>{collapsePoint.rps}</strong></p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-primary">✅ Nenhum ponto de colapso encontrado até {collapseData[collapseData.length - 1]?.users.toLocaleString()} usuários</p>
            )}

            {criticalPoint && !collapsePoint && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-3">
                <p className="text-sm font-semibold text-foreground">⚠️ Zona crítica em ~{criticalPoint.users.toLocaleString()} usuários (DB a {criticalPoint.connPct}%)</p>
              </div>
            )}

            {/* Collapse progression table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Usuários</th>
                    <th className="text-center py-2 text-muted-foreground font-medium">Conn DB %</th>
                    <th className="text-center py-2 text-muted-foreground font-medium">Latência</th>
                    <th className="text-center py-2 text-muted-foreground font-medium">Uptime</th>
                    <th className="text-center py-2 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {collapseData.map((row, i) => (
                    <tr key={i} className={`border-b border-border/50 ${row.connPct >= 100 ? "bg-destructive/5" : row.connPct >= 80 ? "bg-warning/5" : ""}`}>
                      <td className="py-1.5 font-medium">{row.users.toLocaleString()}</td>
                      <td className="py-1.5 text-center">
                        <span className={row.connPct >= 100 ? "text-destructive font-bold" : row.connPct >= 80 ? "text-warning font-semibold" : ""}>{row.connPct}%</span>
                      </td>
                      <td className="py-1.5 text-center">{row.latency}ms</td>
                      <td className="py-1.5 text-center">{row.uptime}%</td>
                      <td className="py-1.5 text-center">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Collapse Chart */}
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={collapseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="users" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 150]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                <ReferenceLine y={100} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "COLAPSO", fill: "hsl(var(--destructive))", fontSize: 10 }} />
                <ReferenceLine y={80} stroke="hsl(var(--warning, 40 90% 50%))" strokeDasharray="3 3" label={{ value: "CRÍTICO", fill: "hsl(40 90% 50%)", fontSize: 10 }} />
                <Line type="monotone" dataKey="connPct" name="Conexões DB %" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ═══ 24H STRESS TEST ═══ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              Simulação 24h — Usuários Online e Carga
            </CardTitle>
            <p className="text-xs text-muted-foreground">Perfil de carga ao longo de um dia típico com {params.users} usuários</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="users" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="latency" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                <Area yAxisId="users" type="monotone" dataKey="onlineUsers" name="Online" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                <Line yAxisId="latency" type="monotone" dataKey="latency" name="Latência (ms)" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold text-foreground">{Math.max(...hourlyData.map(d => d.onlineUsers))}</p>
                <p className="text-[10px] text-muted-foreground">Pico de online</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold text-foreground">{Math.max(...hourlyData.map(d => d.connPct))}%</p>
                <p className="text-[10px] text-muted-foreground">Pico conexões DB</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold text-foreground">{Math.max(...hourlyData.map(d => d.rps))}</p>
                <p className="text-[10px] text-muted-foreground">Pico req/s</p>
              </div>
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
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="p95Uptime" name="P95" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                <Area type="monotone" dataKey="avgUptime" name="Média" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <Area type="monotone" dataKey="p5Uptime" name="P5 (pior)" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Users + Connections Projection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Projeção: Usuários × Conexões DB (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={results.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="users" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="conn" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line yAxisId="users" type="monotone" dataKey="usersProjected" name="Usuários" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line yAxisId="conn" type="monotone" dataKey="connUsagePct" name="Conn DB %" stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak RPS by Month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Req/s no Pico por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={results.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
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
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" name="Simulações" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pb-4">
          Simulação Monte Carlo · Modelo estocástico com crescimento de usuários, falhas aleatórias, degradação de latência e análise de ponto de colapso.
        </p>
      </div>
    </MasterLayout>
  );
};

export default MasterSimulacao;

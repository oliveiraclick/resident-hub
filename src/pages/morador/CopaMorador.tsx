import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, DollarSign, Target, User, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const CopaMorador = () => {
  const { user } = useAuth();
  const [jogos, setJogos] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [totalPrize, setTotalPrize] = useState(0);
  const [stats, setStats] = useState({ home: 85, draw: 10, away: 5 });

  const [isCopaActive, setIsCopaActive] = useState(false);

  useEffect(() => {
    // Check if theme-brasil is active on body
    setIsCopaActive(document.body.classList.contains("theme-brasil"));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: jogosData } = await supabase.from("copa_jogos").select("*").eq('status', 'agendado').limit(1);
      setJogos(jogosData || []);
      
      // Calculate prize pool (simulated for now based on paid bets)
      const { data: paidBets } = await supabase.from("copa_palpites").select("valor_pago").eq("status_pagamento", "pago");
      const total = paidBets?.reduce((acc, curr) => acc + Number(curr.valor_pago), 0) || 0;
      setTotalPrize(total * 0.75); // 75% rule
    };
    fetchData();
  }, []);

  if (!isCopaActive) {
    return (
      <AppShell moduleName="Morador" navItems={[]} title="Copa O Morador" showBack>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <Trophy size={40} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Temporada Encerrada</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            O Bolão Copa O Morador não está ativo no momento.
          </p>
          <Button onClick={() => window.history.back()}>Voltar</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell moduleName="Morador" navItems={[]} title="Copa O Morador" showBack>
      <div className="space-y-6">
        {/* BIG PRIZE COUNTER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-warning to-warning/70 rounded-[32px] p-6 text-white shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Trophy size={80} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest mb-1">Prêmio Acumulado</p>
          <h2 className="text-4xl font-black">R$ {totalPrize.toFixed(2)}</h2>
          <div className="mt-4 flex items-center gap-2 bg-black/20 w-fit px-3 py-1 rounded-full text-[10px] font-bold">
            <ShieldCheck size={12} />
            75% DE TODO VALOR ARRECADADO
          </div>
        </div>

        {/* PROXIMO JOGO & TRENDS */}
        <Card className="rounded-[28px] border-none shadow-md overflow-hidden bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" /> Tendências do Prédio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {jogos.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground">{jogos[0].time_home}</p>
                    <div className="h-2 w-full bg-muted rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${stats.home}%` }} />
                    </div>
                    <span className="text-[10px] font-black">{stats.home}%</span>
                  </div>
                  <div className="w-12">
                    <p className="text-xs font-bold text-muted-foreground">Empate</p>
                    <div className="h-2 w-full bg-muted rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-muted-foreground/30" style={{ width: `${stats.draw}%` }} />
                    </div>
                    <span className="text-[10px] font-black">{stats.draw}%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground">{jogos[0].time_away}</p>
                    <div className="h-2 w-full bg-muted rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-danger" style={{ width: `${stats.away}%` }} />
                    </div>
                    <span className="text-[10px] font-black">{stats.away}%</span>
                  </div>
                </div>
                <Button className="w-full rounded-2xl h-12 bg-primary text-white font-bold text-sm">
                  FAZER MEU PALPITE (R$ 10,00)
                </Button>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground">Nenhum jogo disponível para apostas.</p>
            )}
          </CardContent>
        </Card>

        {/* RANKING SIMPLIFICADO */}
        <Card className="rounded-[28px] border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold">🏆 Ranking do Condomínio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((pos) => (
              <div key={pos} className="flex items-center justify-between p-3 bg-muted/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${pos === 1 ? 'bg-warning text-white' : 'bg-muted'}`}>
                    {pos}º
                  </span>
                  <p className="text-xs font-bold">Vizinho {pos}</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-black">
                  {40 - (pos * 5)} pts
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default CopaMorador;

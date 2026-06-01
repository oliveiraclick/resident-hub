import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, DollarSign, Target, User, ShieldCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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

        {/* BUSCA DE JOGOS */}
        <div className="relative">
          <Input 
            placeholder="Buscar jogos do seu país..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-2xl h-12 pl-12 bg-card border-none shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        </div>

        {/* PROXIMO JOGO & TRENDS */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">
            {searchTerm ? `Resultados para "${searchTerm}"` : "Próximas Partidas"}
          </h3>
          
          {filteredJogos.length > 0 ? (
            filteredJogos.map((jogo: any) => (
              <Card key={jogo.id} className="rounded-[28px] border-none shadow-md overflow-hidden bg-card">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary" /> {jogo.rodada}
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px] font-bold">
                      {new Date(jogo.data_jogo).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-center gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">{jogo.time_home}</p>
                        <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${stats.home}%` }} />
                        </div>
                      </div>
                      <div className="w-10">
                        <p className="text-[10px] font-bold text-muted-foreground">VS</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">{jogo.time_away}</p>
                        <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-danger" style={{ width: `${stats.away}%` }} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{jogo.estadio}</p>
                      <p className="text-[9px] text-muted-foreground opacity-60">{jogo.local}</p>
                    </div>

                    <Button className="w-full rounded-2xl h-11 bg-primary text-white font-bold text-xs">
                      APOSTAR NESTE JOGO
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Nenhum jogo encontrado para "{searchTerm}".</p>
            </div>
          )}
        </div>

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

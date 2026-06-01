import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, ShieldCheck, Search, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BetModal } from "@/components/copa/BetModal";

const CopaMorador = () => {
  const { user } = useAuth();
  const [jogos, setJogos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCopaActive, setIsCopaActive] = useState(false);
  const [prizes, setPrizes] = useState({ placar: 0, artilheiro: 0, campeao: 0, artilheiro_brasil: 0 });
  const [activeTab, setActiveTab] = useState("placar");
  const [stats, setStats] = useState({ home: 85, draw: 10, away: 5 });
  const [selectedJogo, setSelectedJogo] = useState<any>(null);
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    // Theme is applied via useAppTheme hook in App.tsx which adds class to body
    setIsCopaActive(document.body.classList.contains("theme-brasil"));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch upcoming games
      const { data: jogosData } = await supabase
        .from("copa_jogos")
        .select("*")
        .eq('status', 'agendado')
        .order('data_jogo', { ascending: true });
      setJogos(jogosData || []);
      
      // Calculate prize pools by type (taking 75% of paid amounts)
      const { data: paidBets } = await supabase
        .from("copa_palpites")
        .select("valor_pago, tipo")
        .eq("status_pagamento", "pago");
      
      const pools = (paidBets || []).reduce((acc: any, curr: any) => {
        const type = curr.tipo || 'placar';
        acc[type] = (acc[type] || 0) + (Number(curr.valor_pago) * 0.75);
        return acc;
      }, { placar: 0, artilheiro: 0, campeao: 0, artilheiro_brasil: 0 });

      setPrizes(pools);
    };
    fetchData();
  }, []);

  const handleBet = (jogo: any) => {
    setSelectedJogo(jogo);
    setIsBetModalOpen(true);
  };

  const handleBetSuccess = () => {
    // Refresh prize pools (could implement actual refresh logic if needed)
  };

  const filteredJogos = jogos.filter((j: any) => 
    j.time_home.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.time_away.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedJogos = filteredJogos.slice(0, visibleCount);

  if (!isCopaActive) {
    return (
      <MoradorLayout title="Copa O Morador" showBack>
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
      </MoradorLayout>
    );
  }

  return (
    <MoradorLayout title="Copa O Morador" showBack>
      <div className="space-y-6">
        {/* BIG PRIZE COUNTER - SEPARATED BY BET TYPE */}
        <div className="relative overflow-hidden bg-gradient-to-br from-warning to-warning/70 rounded-[32px] p-6 text-white shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Trophy size={80} />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Prêmio Acumulado</p>
                <h2 className="text-4xl font-black">
                  R$ {prizes[activeTab as keyof typeof prizes].toFixed(2)}
                </h2>
              </div>
              <TabsList className="bg-black/20 border-none h-auto p-1 rounded-xl">
                <TabsTrigger value="placar" className="data-[state=active]:bg-white data-[state=active]:text-warning text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all">
                  PLACAR
                </TabsTrigger>
                <TabsTrigger value="artilheiro" className="data-[state=active]:bg-white data-[state=active]:text-warning text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all">
                  ARTILHEIRO
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="mt-4 flex items-center gap-2 bg-black/20 w-fit px-3 py-1 rounded-full text-[10px] font-bold">
              <ShieldCheck size={12} />
              75% DO VALOR {activeTab.toUpperCase()}
            </div>
          </Tabs>
        </div>

        {/* BUSCA DE JOGOS */}
        <div className="relative">
          <Input 
            placeholder="Buscar país (Ex: Brasil)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-2xl h-12 pl-12 bg-card border-none shadow-sm focus-visible:ring-primary"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        </div>

        {/* PROXIMO JOGO & TRENDS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {searchTerm ? `Resultados para "${searchTerm}"` : "Próximas Partidas"}
            </h3>
            {!searchTerm && <Badge variant="secondary" className="text-[9px] font-bold bg-primary/10 text-primary border-none">{jogos.length} JOGOS</Badge>}
          </div>
          
          {paginatedJogos.length > 0 ? (
            <>
              {paginatedJogos.map((jogo: any) => (
                <Card key={jogo.id} className="rounded-[28px] border-none shadow-md overflow-hidden bg-card transition-all hover:shadow-xl active:scale-[0.98]">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                        <TrendingUp size={14} className="text-primary" /> {jogo.rodada}
                      </CardTitle>
                      <Badge variant="outline" className="text-[9px] font-bold border-muted-foreground/20">
                        {new Date(jogo.data_jogo).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {new Date(jogo.data_jogo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-center gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{jogo.time_home}</p>
                          <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-success" style={{ width: `${stats.home}%` }} />
                          </div>
                        </div>
                        <div className="w-10">
                          <p className="text-[10px] font-bold text-muted-foreground italic">VS</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{jogo.time_away}</p>
                          <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-danger" style={{ width: `${stats.away}%` }} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-0.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-black">{jogo.estadio}</p>
                        <p className="text-[9px] text-muted-foreground opacity-60 font-medium">{jogo.local}</p>
                      </div>

                      <Button 
                        onClick={() => handleBet(jogo)}
                        className="w-full rounded-2xl h-11 bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-primary/20"
                      >
                        APOSTAR NESTE JOGO
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {visibleCount < filteredJogos.length && (
                <Button 
                  variant="ghost" 
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="w-full py-8 text-xs font-black uppercase text-muted-foreground hover:text-primary transition-colors border-2 border-dashed border-muted rounded-[28px]"
                >
                  Carregar mais jogos (+6)
                </Button>
              )}
            </>
          ) : (
            <div className="py-16 text-center bg-muted/20 rounded-[32px] border-2 border-dashed border-muted">
              <p className="text-sm text-muted-foreground font-medium">Nenhum jogo encontrado para "{searchTerm}".</p>
            </div>
          )}
        </div>

        {/* RANKING SIMPLIFICADO */}
        <Card className="rounded-[32px] border-none shadow-md bg-card overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Trophy className="text-warning" size={18} /> RANKING DO CONDOMÍNIO
              </CardTitle>
              <ChevronRight size={18} className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {[1, 2, 3].map((pos) => (
              <div key={pos} className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/30 transition-colors rounded-2xl border border-transparent hover:border-primary/10">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shadow-sm ${pos === 1 ? 'bg-warning text-white' : pos === 2 ? 'bg-slate-300 text-slate-700' : 'bg-orange-300 text-orange-800'}`}>
                    {pos}º
                  </span>
                  <div>
                    <p className="text-xs font-bold">Vizinho {pos}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Bloco A • Ap 10{pos}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-[11px] font-black border-primary/20 bg-primary/5 text-primary">
                    {40 - (pos * 5)} PTS
                  </Badge>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
              Ver Ranking Completo
            </Button>
          </CardContent>
        </Card>
      </div>

      <BetModal 
        isOpen={isBetModalOpen}
        onClose={() => setIsBetModalOpen(false)}
        jogo={selectedJogo}
        betType={activeTab}
        onSuccess={handleBetSuccess}
      />
    </MoradorLayout>
  );
};

export default CopaMorador;

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
   const [prizes, setPrizes] = useState({ placar: 0, campeao: 0, bolao: 0 });
  const [betCounts, setBetCounts] = useState({ placar: 0, campeao: 0, bolao: 0 });
  const [activeTab, setActiveTab] = useState("placar");
  const [stats, setStats] = useState({ home: 85, draw: 10, away: 5 });
  const [selectedJogo, setSelectedJogo] = useState<any>(null);
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    // Theme is applied via useAppTheme hook in App.tsx which adds class to body
    setIsCopaActive(document.body.classList.contains("theme-brasil"));
  }, []);

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
      .select("valor_pago, tipo, user_id")
      .eq("status_pagamento", "pago");
    
    const pools = { placar: 0, campeao: 0, bolao: 0 };
    const counts = { placar: 0, campeao: 0, bolao: 0 };
    const uniqueUsersByType: Record<string, Set<string>> = {
      placar: new Set(),
      campeao: new Set(),
      bolao: new Set()
    };

    (paidBets || []).forEach((curr: any) => {
      const type = curr.tipo || 'placar';
      if (pools.hasOwnProperty(type)) {
        pools[type as keyof typeof pools] += (Number(curr.valor_pago) * 0.75);
        if (curr.user_id) {
          uniqueUsersByType[type].add(curr.user_id);
        }
      }
    });

    Object.keys(uniqueUsersByType).forEach(type => {
      counts[type as keyof typeof counts] = uniqueUsersByType[type].size;
    });

    setPrizes(pools);
    setBetCounts(counts);

    // Fetch ranking data
    const { data: rankingData } = await supabase
      .from("copa_palpites")
      .select(`
        user_id,
        profiles (
          nome,
          rua,
          numero_casa
        ),
        pontos
      `)
      .order('pontos', { ascending: false });

    // Group by user and sum points
    const userRanking = (rankingData || []).reduce((acc: any, curr: any) => {
      const userId = curr.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          nome: curr.profiles?.nome || "Morador",
          localizacao: curr.profiles?.rua ? `${curr.profiles.rua}${curr.profiles.numero_casa ? `, ${curr.profiles.numero_casa}` : ''}` : "Condomínio",
          pontos: 0
        };
      }
      acc[userId].pontos += curr.pontos || 0;
      return acc;
    }, {});

    const sortedRanking = Object.values(userRanking)
      .sort((a: any, b: any) => b.pontos - a.pontos)
      .slice(0, 3);

    setRanking(sortedRanking);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBet = (jogo: any) => {
    setSelectedJogo(jogo);
    setIsBetModalOpen(true);
  };

  const handleBetSuccess = () => {
    fetchData();
  };

  const filteredJogos = jogos.filter((j: any) => {
    const matchesSearch = j.time_home.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         j.time_away.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "bolao") return matchesSearch;
    
    const isBrazilGame = j.time_home.toLowerCase() === "brasil" || j.time_away.toLowerCase() === "brasil";
    return isBrazilGame && matchesSearch;
  });

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
          
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Prêmio Acumulado</p>
                <div className="flex items-center gap-2 bg-white text-warning px-3 py-1 rounded-xl shadow-sm">
                  <Users size={16} className="font-bold" />
                  <span className="text-sm font-black">{betCounts[activeTab as keyof typeof betCounts]} {betCounts[activeTab as keyof typeof betCounts] === 1 ? 'Pessoa' : 'Pessoas'}</span>
                </div>
              </div>
              <h2 className="text-4xl font-black">
                R$ {prizes[activeTab as keyof typeof prizes].toFixed(2)}
              </h2>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'placar', label: 'JOGO' },
                { id: 'campeao', label: 'CAMPEÃO' },
                { id: 'bolao', label: 'BOLÃO' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${
                    activeTab === tab.id 
                      ? 'bg-white text-warning border-white shadow-md' 
                      : 'bg-black/10 text-white border-white/20 hover:bg-black/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* SPECIAL BETS (Campeão / Bolão) */}
        {(activeTab === "campeao" || activeTab === "bolao") && (
          <Card className="rounded-[32px] border-none shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 p-6 border border-primary/20 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy size={32} className="text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase italic">
                  {activeTab === "campeao" ? "Palpite de Longo Prazo" : "Bolão O Morador"}
                </h3>
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[10px] font-black">PLACA EXATO: 5 PTS</Badge>
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[10px] font-black">VENCEDOR: 3 PTS</Badge>
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[10px] font-black">EMPATE: 3 PTS</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase italic">Ganhas quem faz mais pontos no final do campeonato</p>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {activeTab === "campeao" 
                    ? "Quem levantará a taça em 19 de julho de 2026?" 
                    : "Participe do nosso bolão exclusivo e concorra ao prêmio acumulado!"}
                </p>
              </div>
              <Button 
                onClick={() => handleBet({ id: 'seasonal', time_home: 'COPA 2026', time_away: 'O MORADOR' })}
                className="w-full rounded-2xl h-12 bg-primary text-white font-black uppercase italic tracking-widest shadow-xl shadow-primary/20"
              >
                DAREI MEU PALPITE AGORA
              </Button>
            </div>
          </Card>
        )}

        {/* BUSCA DE JOGOS (Show for placar and bolao) */}
        {(activeTab === "placar" || activeTab === "bolao") && (
          <div className="relative">
            <Input 
              placeholder="Buscar país (Ex: Brasil)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-2xl h-12 pl-12 bg-card border-none shadow-sm focus-visible:ring-primary"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          </div>
        )}

        {/* PROXIMO JOGO & TRENDS (Show for placar and bolao) */}
        {(activeTab === "placar" || activeTab === "bolao") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {searchTerm ? `Resultados para "${searchTerm}"` : activeTab === "bolao" ? "Todos os Jogos da Copa" : "Jogos do Brasil - 1ª Fase"}
              </h3>
              {!searchTerm && <Badge variant="secondary" className="text-[9px] font-bold bg-primary/10 text-primary border-none">{jogos.length} JOGOS</Badge>}
            </div>
            
            {paginatedJogos.length > 0 ? (
              <>
                {paginatedJogos.map((jogo: any) => {
                  const dataJogo = new Date(jogo.data_jogo);
                  const now = new Date();
                  const diffMinutes = (dataJogo.getTime() - now.getTime()) / (1000 * 60);
                  const canBet = diffMinutes > 20;

                  return (
                    <Card key={jogo.id} className="rounded-[28px] border-none shadow-md overflow-hidden bg-card transition-all hover:shadow-xl active:scale-[0.98]">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                            <TrendingUp size={14} className="text-primary" /> {jogo.rodada}
                          </CardTitle>
                          <Badge variant="outline" className={`text-[9px] font-bold ${!canBet ? 'bg-danger/10 text-danger border-danger/20' : 'border-muted-foreground/20'}`}>
                            {dataJogo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {!canBet && " • ENCERRADO"}
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

                          {canBet ? (
                            <Button 
                              onClick={() => handleBet(jogo)}
                              className="w-full rounded-2xl h-11 bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-primary/20"
                            >
                              APOSTAR NESTE JOGO
                            </Button>
                          ) : (
                            <div className="w-full py-2 bg-muted/30 rounded-2xl text-center">
                              <p className="text-[9px] font-black uppercase text-muted-foreground opacity-70">Apostas encerradas para este jogo</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
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
        )}

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
            {ranking.length > 0 ? (
              ranking.map((player: any, index) => {
                const pos = index + 1;
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/30 transition-colors rounded-2xl border border-transparent hover:border-primary/10">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shadow-sm ${pos === 1 ? 'bg-warning text-white' : pos === 2 ? 'bg-slate-300 text-slate-700' : 'bg-orange-300 text-orange-800'}`}>
                        {pos}º
                      </span>
                      <div>
                        <p className="text-xs font-bold">{player.nome}</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">{player.localizacao}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[11px] font-black border-primary/20 bg-primary/5 text-primary">
                        {player.pontos} PTS
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center bg-muted/10 rounded-2xl border border-dashed border-muted">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Nenhuma aposta realizada ainda</p>
              </div>
            )}
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

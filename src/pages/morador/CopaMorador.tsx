import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MoradorLayout from "@/components/MoradorLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, ShieldCheck, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
  const [selectedJogo, setSelectedJogo] = useState<any>(null);
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [saldo, setSaldo] = useState(0);
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    setIsCopaActive(document.body.classList.contains("theme-brasil"));
  }, []);

  const fetchData = async () => {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("saldo")
        .eq("id", user.id)
        .single();
      if (profile) setSaldo(Number(profile.saldo) || 0);
    }

    const { data: jogosData } = await supabase
      .from("copa_jogos")
      .select("*")
      .eq('status', 'agendado')
      .order('data_jogo', { ascending: true });
    setJogos(jogosData || []);
    
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
      .slice(0, 5);

    setRanking(sortedRanking);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBet = (jogo: any, type?: string) => {
    setSelectedJogo(jogo);
    if (type) setActiveTab(type);
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
          <Button onClick={() => window.history.back()}>Voltar</Button>
        </div>
      </MoradorLayout>
    );
  }

  return (
    <MoradorLayout title="Copa O Morador" showBack>
      <div className="space-y-6">
        <div className="flex flex-col gap-1 px-1">
          <p className="text-xs text-muted-foreground font-medium">Faça seus palpites e responda perguntas</p>
        </div>

        {/* BIG PRIZE COUNTER - SEPARATED BY BET TYPE */}
        <div className="relative overflow-hidden bg-gradient-to-br from-warning to-warning/70 rounded-[32px] p-6 text-white shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Trophy size={80} />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Prêmio Acumulado</p>
                <h2 className="text-4xl font-black">
                  R$ {prizes[activeTab as keyof typeof prizes].toFixed(2)}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Meu Saldo</p>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-xl border border-white/30">
                  <span className="text-xl font-black">R$ {saldo.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full border border-white/30">
                <Users size={14} className="opacity-90" />
                <span className="text-[11px] font-black">{betCounts[activeTab as keyof typeof betCounts]} {betCounts[activeTab as keyof typeof betCounts] === 1 ? 'Pessoa' : 'Pessoas'}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 rounded-xl bg-white text-warning border-none font-black text-[10px] uppercase shadow-sm"
                onClick={() => toast.info("Para adicionar saldo, entre em contato com o administrador.")}
              >
                + ADICIONAR CRÉDITO
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'placar', label: 'JOGOS BRASIL' },
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
          <div className="rounded-[32px] border-none shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 p-6 border border-primary/20 animate-in zoom-in-95 duration-300">
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
                onClick={() => handleBet({ id: 'seasonal', time_home: 'COPA 2026', time_away: 'O MORADOR' }, activeTab)}
                className="w-full rounded-2xl h-12 bg-primary text-white font-black uppercase italic tracking-widest shadow-xl shadow-primary/20"
              >
                DAREI MEU PALPITE AGORA
              </Button>
            </div>
          </div>
        )}

        {/* BUSCA DE JOGOS (Show for placar and bolao) */}
        {(activeTab === "placar" || activeTab === "bolao") && (
          <div className="relative">
            <input 
              placeholder="Buscar país (Ex: Brasil)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-2xl h-12 pl-12 bg-card border-none shadow-sm focus-visible:ring-primary w-full"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5">
              <ShieldCheck size={20} />
            </div>
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
                    <div key={jogo.id} className="rounded-[28px] border-none shadow-md overflow-hidden bg-card transition-all hover:shadow-xl active:scale-[0.98] p-6">
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                            <TrendingUp size={14} className="text-primary" /> {jogo.rodada}
                          </div>
                          <Badge variant="outline" className={`text-[9px] font-bold ${!canBet ? 'bg-danger/10 text-danger border-danger/20' : 'border-muted-foreground/20'}`}>
                            {dataJogo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {!canBet && " • ENCERRADO"}
                          </Badge>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-center gap-4">
                            <div className="flex-1">
                              <p className="text-xs font-bold text-foreground truncate">{jogo.time_home}</p>
                              <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-success" style={{ width: `85%` }} />
                              </div>
                            </div>
                            <div className="w-10">
                              <p className="text-[10px] font-bold text-muted-foreground italic">VS</p>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-foreground truncate">{jogo.time_away}</p>
                              <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-danger" style={{ width: `5%` }} />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-0.5 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-black">{jogo.estadio}</p>
                            <p className="text-[9px] text-muted-foreground opacity-60 font-medium">{jogo.local}</p>
                          </div>

                          {canBet ? (
                            <Button 
                              onClick={() => handleBet(jogo, activeTab)}
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
                    </div>
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

        {(activeTab === "placar" || activeTab === "bolao") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary" /> 11 de Junho
              </h3>
              <Badge variant="secondary" className="text-[9px] font-bold bg-white/5 text-muted-foreground border-none">2 JOGOS</Badge>
            </div>
            
            {paginatedJogos.length > 0 ? (
              <div className="space-y-4">
                {paginatedJogos.map((jogo: any) => {
                  const dataJogo = new Date(jogo.data_jogo);
                  const now = new Date();
                  const diffMinutes = (dataJogo.getTime() - now.getTime()) / (1000 * 60);
                  const canBet = diffMinutes > 20;

                  return (
                    <div key={jogo.id} className="bg-[#1a2e25] rounded-[32px] border border-white/5 overflow-hidden shadow-xl transition-all hover:border-primary/20">
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground/60 uppercase">
                          <span className="flex items-center gap-1.5 italic">
                            <TrendingUp size={12} className="text-primary" /> {jogo.rodada}
                          </span>
                          <span className="bg-white/5 px-2 py-1 rounded-lg">
                            {dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • EM {Math.floor(diffMinutes / 60)}H
                          </span>
                        </div>

                        <div className="flex items-center justify-between px-2">
                          <div className="flex flex-col items-center gap-3 flex-1">
                            <div className="w-14 h-10 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
                              <span className="text-xl font-black opacity-40">BR</span>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tighter text-white">{jogo.time_home}</span>
                          </div>

                          <div className="flex flex-col items-center gap-1 px-4">
                            <span className="text-[10px] font-black text-muted-foreground/40 italic">VS</span>
                          </div>

                          <div className="flex flex-col items-center gap-3 flex-1">
                            <div className="w-14 h-10 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
                              <span className="text-xl font-black opacity-40">SA</span>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tighter text-white">{jogo.time_away}</span>
                          </div>

                          <div className="flex flex-col items-center justify-center ml-4 pl-4 border-l border-white/5 min-w-[60px]">
                            <p className="text-[8px] font-black text-muted-foreground/60 uppercase mb-1">Status</p>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${canBet ? 'bg-white/5 border border-white/10' : 'bg-primary/20 border border-primary/30'}`}>
                              {canBet ? <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" /> : <ShieldCheck size={18} className="text-primary" />}
                            </div>
                            <p className="text-[8px] font-black mt-1 uppercase text-muted-foreground/40">{canBet ? 'Sem palpite' : 'Feito'}</p>
                          </div>
                        </div>

                        {canBet ? (
                          <Button 
                            onClick={() => handleBet(jogo, activeTab)}
                            className="w-full rounded-2xl h-12 bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                          >
                            Enviar Palpite <ChevronRight size={16} />
                          </Button>
                        ) : (
                          <div className="w-full py-3 bg-white/5 rounded-2xl text-center border border-white/5">
                            <p className="text-[9px] font-black uppercase text-muted-foreground opacity-50 italic">Apostas encerradas para este jogo</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {visibleCount < filteredJogos.length && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setVisibleCount(prev => prev + 6)}
                    className="w-full py-8 text-xs font-black uppercase text-white/40 hover:text-primary transition-colors border-2 border-dashed border-white/5 rounded-[32px] bg-[#1a2e25]/50"
                  >
                    Carregar mais jogos (+6)
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-16 text-center bg-[#1a2e25] rounded-[32px] border border-dashed border-white/10 shadow-inner">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">Nenhum jogo encontrado</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "bolao" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Trophy size={14} className="text-warning" /> Ranking Global
              </h3>
            </div>
            
            <div className="bg-[#1a2e25] rounded-[32px] border border-white/5 p-2 overflow-hidden shadow-xl">
              {ranking.length > 0 ? (
                ranking.map((player: any, index) => {
                  const pos = index + 1;
                  return (
                    <div key={index} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-2xl border border-transparent">
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black shadow-lg ${pos === 1 ? 'bg-warning text-white rotate-12' : pos === 2 ? 'bg-slate-400 text-white' : 'bg-orange-400 text-white'}`}>
                          {pos}º
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{player.nome}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter opacity-60">{player.localizacao}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-primary/20 px-3 py-1.5 rounded-xl border border-primary/20">
                          <span className="text-[11px] font-black text-primary">
                            {player.pontos} <span className="text-[8px] opacity-70">PTS</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40 italic">O campeonato ainda não começou</p>
                </div>
              )}
            </div>
          </div>
        )}
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
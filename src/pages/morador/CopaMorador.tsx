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

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a2e25] border border-primary/20 rounded-3xl p-4 flex flex-col justify-between min-h-[100px] shadow-lg shadow-black/20">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Prêmio Acumulado</p>
              <h2 className="text-2xl font-black text-white mt-1">
                R$ {prizes[activeTab as keyof typeof prizes].toFixed(2)}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-primary/60">
              <Users size={12} />
              <span className="text-[10px] font-black">{betCounts[activeTab as keyof typeof betCounts]} {betCounts[activeTab as keyof typeof betCounts] === 1 ? 'Pessoa' : 'Pessoas'}</span>
            </div>
          </div>

          <div className="bg-[#1a2e25] border border-primary/20 rounded-3xl p-4 flex flex-col justify-between min-h-[100px] shadow-lg shadow-black/20">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Meu Saldo</p>
              <h2 className="text-2xl font-black text-white mt-1">
                R$ {saldo.toFixed(2)}
              </h2>
            </div>
            <button 
              onClick={() => toast.info("Para adicionar saldo, entre em contato com o administrador.")}
              className="text-[10px] font-black text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              + RECARREGAR
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          {['QUI. 11', 'SEX. 12', 'SÁB. 13', 'DOM. 14', 'SEG. 15', 'TER. 16', 'QUA. 17'].map((day, i) => (
            <div key={i} className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border transition-all ${i === 0 ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-[#1a2e25] border-white/5 text-muted-foreground'}`}>
              <span className="text-[8px] font-black uppercase opacity-60 mb-1">{day.split(' ')[0]}</span>
              <span className="text-sm font-black">{day.split(' ')[1]}</span>
              <div className={`w-1 h-1 rounded-full mt-1 ${i === 0 ? 'bg-white' : 'bg-white/20'}`} />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 bg-[#1a2e25] p-1.5 rounded-2xl border border-white/5">
          <button className="flex-1 py-2 text-[10px] font-black uppercase bg-primary/20 text-primary rounded-xl">Próximos</button>
          <button className="flex-1 py-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">Finalizados</button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'placar', label: 'Jogos' },
            { id: 'campeao', label: 'Campeão' },
            { id: 'bolao', label: 'Ranking' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 rounded-2xl text-[10px] font-black uppercase transition-all border flex items-center justify-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                  : 'bg-[#1a2e25] text-muted-foreground border-white/5 hover:bg-white/5'
              }`}
            >
              {tab.id === 'placar' && <ShieldCheck size={12} />}
              {tab.id === 'campeao' && <Trophy size={12} />}
              {tab.id === 'bolao' && <TrendingUp size={12} />}
              {tab.label}
            </button>
          ))}
        </div>

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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MoradorLayout from "@/components/MoradorLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, ShieldCheck, Users, ChevronRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BetModal } from "@/components/copa/BetModal";

interface SelecaoCopa {
  id: string;
  nome: string;
  status: string;
  logo_url: string | null;
}

const CopaMorador = () => {
  const { user } = useAuth();
  const [jogos, setJogos] = useState([]);
  const [meusPalpites, setMeusPalpites] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCopaActive, setIsCopaActive] = useState(false);
  const [prizes, setPrizes] = useState({ placar: 0, campeao: 0, bolao: 0 });
  const [betCounts, setBetCounts] = useState({ placar: 0, campeao: 0, bolao: 0 });
  const [activeTab, setActiveTab] = useState("placar");
  const [selectedJogo, setSelectedJogo] = useState<any>(null);
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [forceShowMultiplas, setForceShowMultiplas] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [saldo, setSaldo] = useState(0);
  const [ranking, setRanking] = useState([]);
  const [selecoesCopa, setSelecoesCopa] = useState<SelecaoCopa[]>([]);
  const [isLoadingSelecoes, setIsLoadingSelecoes] = useState(false);

  useEffect(() => {
    setIsCopaActive(true);
  }, []);

  const fetchSelecoes = async () => {
    setIsLoadingSelecoes(true);
    const { data, error } = await supabase
      .from("copa_selecoes")
      .select("*")
      .order("nome");
    
    if (!error && data) {
      setSelecoesCopa(data);
    }
    setIsLoadingSelecoes(false);
  };

  const fetchData = async () => {
    fetchSelecoes();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("saldo")
        .eq("id", user.id)
        .single();
      if (profile) setSaldo(Number(profile.saldo) || 0);

      const { data: userBets } = await supabase
        .from("copa_palpites")
        .select("*")
        .eq("user_id", user.id);
      
      if (userBets) setMeusPalpites(userBets);
    }

    const { data: jogosData } = await supabase
      .from("copa_jogos")
      .select("*, copa_palpites(count)")
      .eq('status', 'agendado')
      .eq('copa_palpites.status_pagamento', 'pago')
      .order('data_jogo', { ascending: true });
    
    const processedJogos = (jogosData || []).map((j: any) => ({
      ...j,
      palpites_count: j.copa_palpites?.[0]?.count || 0
    }));
    setJogos(processedJogos);
    
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
    setForceShowMultiplas(false);
  };

  const handleRecarregar = () => {
    setSelectedJogo({ id: 'recharge', time_home: 'SISTEMA', time_away: 'RECARGA' });
    setActiveTab('placar'); // Just to avoid issues with betType
    setForceShowMultiplas(true);
    setIsBetModalOpen(true);
  };

  const handleSelectCampeao = (selecao: string) => {
    setSelectedJogo({ id: '00000000-0000-0000-0000-000000000000', time_home: selecao, time_away: 'O MORADOR' });
    setActiveTab('campeao');
    setIsBetModalOpen(true);
  };

  const handleBetSuccess = () => {
    fetchData();
  };

  const filteredJogos = jogos.filter((j: any) => {
    const matchesSearch = j.time_home.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         j.time_away.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "bolao") return matchesSearch;
    // Em "Jogos", mostramos apenas os jogos do Brasil
    const isBrazilGame = j.time_home.toLowerCase().trim() === "brasil" || j.time_away.toLowerCase().trim() === "brasil";
    return isBrazilGame && matchesSearch;
  });

  const GameList = ({ items }: { items: any[] }) => (
    <div className="space-y-5">
      {items.map((jogo: any) => {
        const dataJogo = new Date(jogo.data_jogo);
        const now = new Date();
        const diffMinutes = (dataJogo.getTime() - now.getTime()) / (1000 * 60);
        const canBet = diffMinutes > 20;
        
        const meuPalpite = meusPalpites.find(p => p.jogo_id === jogo.id && p.tipo === activeTab);
        const hasBet = !!meuPalpite;

        return (
          <div key={jogo.id} className="bg-[#1a2e25] rounded-[32px] border border-white/5 overflow-hidden shadow-xl transition-all hover:border-primary/20">
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                <span className="flex items-center gap-2 italic">
                  <TrendingUp size={12} className="text-primary" /> {jogo.rodada}
                </span>
                <span className="bg-white/5 px-2.5 py-1 rounded-lg">
                  {dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {dataJogo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex flex-col items-center gap-3 flex-1">
                  <div className="w-16 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                    {jogo.time_home_logo_url ? (
                      <img src={jogo.time_home_logo_url} alt={jogo.time_home} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-black opacity-30">{jogo.time_home.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-[12px] font-black uppercase tracking-tight text-white leading-none">{jogo.time_home}</span>
                </div>

                <div className="flex flex-col items-center gap-1 px-4">
                  <span className="text-[10px] font-black text-muted-foreground/30 italic tracking-tighter">VS</span>
                </div>

                <div className="flex flex-col items-center gap-3 flex-1">
                  <div className="w-16 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                    {jogo.time_away_logo_url ? (
                      <img src={jogo.time_away_logo_url} alt={jogo.time_away} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-black opacity-30">{jogo.time_away.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-[12px] font-black uppercase tracking-tight text-white leading-none">{jogo.time_away}</span>
                </div>
          </div>

              {hasBet ? (
                <div className="w-full p-4 bg-primary/10 rounded-[24px] border border-primary/20 flex flex-col items-center gap-2">
                  <p className="text-[10px] font-black uppercase text-primary italic tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} /> Seu Palpite Enviado
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-black text-white">{meuPalpite.palpite_valor?.h ?? '-'}</div>
                    <div className="text-[10px] font-black text-muted-foreground italic">X</div>
                    <div className="text-xl font-black text-white">{meuPalpite.palpite_valor?.a ?? '-'}</div>
                  </div>
                  {meuPalpite.status_pagamento === 'pendente' && (
                    <Badge variant="outline" className="text-[8px] border-yellow-500/50 text-yellow-500 bg-yellow-500/5">AGUARDANDO VALIDAÇÃO</Badge>
                  )}
                </div>
              ) : canBet ? (
                <Button 
                  onClick={() => handleBet(jogo, activeTab)}
                  className="w-full rounded-2xl h-14 bg-primary hover:bg-primary/90 text-white font-black text-[12px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  Enviar Meu Palpite <ChevronRight size={18} />
                </Button>
              ) : (
                <div className="w-full py-4 bg-white/[0.02] rounded-3xl text-center border border-white/5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground/30 italic tracking-widest">Apostas encerradas</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
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
          <Button onClick={() => window.history.back()}>Voltar</Button>
        </div>
      </MoradorLayout>
    );
  }

  return (
    <MoradorLayout title="Palpites" showBack>
      <div className="space-y-6 pb-20 no-scrollbar">
        <div className="flex flex-col gap-1 px-1">
          <p className="text-xs text-muted-foreground font-medium">Faça seus palpites e acompanhe os resultados reais</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-[#1a2e25] border border-primary/20 rounded-3xl p-5 flex flex-col justify-between min-h-[110px] shadow-lg shadow-black/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Prêmio Acumulado</p>
                <h2 className="text-3xl font-black text-white mt-1.5 leading-none">
                  R$ {prizes[activeTab as keyof typeof prizes].toFixed(2)}
                </h2>
              </div>
              <div className="bg-primary/10 px-3 py-1 rounded-xl flex items-center gap-1.5 text-primary">
                <Users size={12} />
                <span className="text-[10px] font-black">{betCounts[activeTab as keyof typeof betCounts]} {betCounts[activeTab as keyof typeof betCounts] === 1 ? 'Pessoa' : 'Pessoas'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Meu Saldo</p>
                <p className="text-xl font-black text-white">R$ {saldo.toFixed(2)}</p>
              </div>
              <button 
                onClick={handleRecarregar}
                className="bg-primary text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                + RECARREGAR
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'placar', label: 'Jogos do Brasil', icon: ShieldCheck },
            { id: 'campeao', label: 'Campeão', icon: Trophy },
            { id: 'bolao', label: 'Bolão', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 rounded-2xl text-[11px] font-black uppercase transition-all border flex flex-col items-center justify-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                  : 'bg-[#1a2e25] text-muted-foreground border-white/5 hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-muted-foreground/40'} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "campeao" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col gap-1">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Trophy size={14} className="text-primary" /> Escolha seu Campeão
                </h3>
                <p className="text-[9px] text-muted-foreground/60 uppercase font-bold italic">Selecione o país que levantará a taça</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchSelecoes}
                disabled={isLoadingSelecoes}
                className="h-8 w-8 rounded-full bg-[#1a2e25] text-primary hover:text-primary/80 border border-primary/20"
              >
                <RefreshCw size={14} className={isLoadingSelecoes ? "animate-spin" : ""} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selecoesCopa.map((selecao) => {
                const isEliminated = selecao.status === 'eliminado';
                return (
                  <button
                    key={selecao.id}
                    disabled={isEliminated}
                    onClick={() => handleSelectCampeao(selecao.nome)}
                    className={`bg-[#1a2e25] border border-white/5 rounded-3xl p-4 flex flex-col items-center justify-center gap-3 transition-all shadow-lg relative overflow-hidden group ${
                      isEliminated 
                        ? 'opacity-40 grayscale cursor-not-allowed border-red-500/20' 
                        : 'hover:border-primary/40 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {isEliminated && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-black/80 px-2 py-0.5 rounded rotate-[-15deg] border border-red-500/40 shadow-lg shadow-black">Eliminado</span>
                      </div>
                    )}
                    <div className="w-12 h-8 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 group-hover:bg-primary/10 transition-colors">
                      {selecao.logo_url ? (
                        <img src={selecao.logo_url} alt={selecao.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black opacity-30 group-hover:opacity-70">{selecao.nome.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-tight transition-colors ${isEliminated ? 'text-muted-foreground' : 'text-white group-hover:text-primary'}`}>{selecao.nome}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "placar" && (
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-4 bg-[#1a2e25] p-1.5 rounded-2xl border border-white/5 mb-2">
              <button className="flex-1 py-3 text-[11px] font-black uppercase bg-primary/20 text-primary rounded-[14px]">Próximos</button>
              <button className="flex-1 py-3 text-[11px] font-black uppercase text-muted-foreground hover:text-white transition-colors">Finalizados</button>
            </div>

            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary" /> Jogos do Brasil
              </h3>
              <Badge variant="secondary" className="text-[9px] font-bold bg-white/5 text-muted-foreground/40 border-none px-3 py-1">{filteredJogos.length} JOGOS</Badge>
            </div>
            
            {paginatedJogos.length > 0 ? (
              <div className="space-y-5">
                <GameList items={paginatedJogos} />
                
                {visibleCount < filteredJogos.length && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setVisibleCount(prev => prev + 6)}
                    className="w-full py-10 text-[11px] font-black uppercase text-muted-foreground/40 hover:text-primary transition-all border-2 border-dashed border-white/5 rounded-[32px] bg-[#1a2e25]/50"
                  >
                    Carregar mais jogos
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-20 text-center bg-[#1a2e25] rounded-[44px] border border-dashed border-white/10 shadow-inner">
                <p className="text-xs text-muted-foreground/40 font-black uppercase tracking-[0.2em]">Nenhum confronto encontrado</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "bolao" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" /> Bolão (Todos os Jogos)
              </h3>
              <Badge variant="secondary" className="text-[9px] font-bold bg-white/5 text-muted-foreground/40 border-none px-3 py-1">{filteredJogos.length} JOGOS</Badge>
            </div>
            
            {paginatedJogos.length > 0 ? (
              <div className="space-y-5">
                <GameList items={paginatedJogos} />
                
                {visibleCount < filteredJogos.length && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setVisibleCount(prev => prev + 6)}
                    className="w-full py-10 text-[11px] font-black uppercase text-muted-foreground/40 hover:text-primary transition-all border-2 border-dashed border-white/5 rounded-[32px] bg-[#1a2e25]/50"
                  >
                    Carregar mais jogos
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-20 text-center bg-[#1a2e25] rounded-[44px] border border-dashed border-white/10 shadow-inner">
                <p className="text-xs text-muted-foreground/40 font-black uppercase tracking-[0.2em]">Nenhum confronto encontrado</p>
              </div>
            )}

            <div className="pt-8 space-y-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Trophy size={16} className="text-warning" /> Ranking Geral
                </h3>
              </div>
              
              <div className="bg-[#1a2e25] rounded-[40px] border border-white/5 p-3 overflow-hidden shadow-2xl">
                {ranking.length > 0 ? (
                  ranking.map((player: any, index) => {
                    const pos = index + 1;
                    return (
                      <div key={index} className="flex items-center justify-between p-5 hover:bg-white/[0.03] transition-all rounded-3xl border border-transparent">
                        <div className="flex items-center gap-5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[14px] font-black shadow-lg ${pos === 1 ? 'bg-warning text-white rotate-6' : pos === 2 ? 'bg-slate-400 text-white' : 'bg-orange-400 text-white'}`}>
                            {pos}º
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-white uppercase tracking-tight">{player.nome}</p>
                            <p className="text-[10px] text-muted-foreground/40 uppercase font-black tracking-tighter mt-0.5">{player.localizacao}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-primary/20 px-4 py-2 rounded-2xl border border-primary/20">
                            <span className="text-[12px] font-black text-primary">
                              {player.pontos} <span className="text-[9px] opacity-50 ml-0.5">PTS</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.2em] italic">O ranking será atualizado em breve</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <BetModal 
        isOpen={isBetModalOpen}
        onClose={() => {
          setIsBetModalOpen(false);
          setForceShowMultiplas(false);
        }}
        jogo={selectedJogo}
        betType={activeTab}
        onSuccess={handleBetSuccess}
        forceShowMultiplas={forceShowMultiplas}
      />
    </MoradorLayout>
  );
};

export default CopaMorador;
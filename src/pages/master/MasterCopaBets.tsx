import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, CheckCircle2, Clock, Users, Plus, Trash2, Search, RefreshCw, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

const MasterCopaBets = () => {
  const [activeTab, setActiveTab] = useState("pagamentos");
  const [jogos, setJogos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [palpites, setPalpites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const { data: jogosData } = await supabase
      .from("copa_jogos")
      .select("*")
      .order("data_jogo", { ascending: true });
    const { data: palpitesData } = await supabase
      .from("copa_palpites")
      .select("*, profiles(nome), copa_jogos(time_home, time_away)")
      .order("created_at", { ascending: false });
    
    setJogos(jogosData || []);
    setPalpites(palpitesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprovePayment = async (betId: string) => {
    try {
      const { data: bet, error: fetchError } = await supabase
        .from("copa_palpites")
        .select("valor_pago, user_id, status_pagamento")
        .eq("id", betId)
        .single();

      if (fetchError || !bet) throw new Error("Aposta não encontrada");
      
      if (bet.status_pagamento === "pago") {
        toast({ title: "Informação", description: "Este pagamento já foi aprovado." });
        return;
      }

      const { error: updateError } = await supabase
        .from("copa_palpites")
        .update({ status_pagamento: "pago", pago: true })
        .eq("id", betId);

      if (updateError) throw updateError;

      const valorAprovado = Number(bet.valor_pago) || 0;
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("saldo")
        .eq("user_id", bet.user_id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error("Perfil do morador não encontrado");

      const novoSaldo = (Number(profile.saldo) || 0) + valorAprovado;

      // Update the user's main balance in profiles
      const { error: walletError } = await supabase
        .from("profiles")
        .update({ saldo: novoSaldo })
        .eq("user_id", bet.user_id);

      if (walletError) throw walletError;
      
      sonnerToast.success(`Pagamento aprovado! R$ ${valorAprovado.toFixed(2)} liberado.`);
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
      console.error(error);
    }
  };

  const handleDeleteBet = async (betId: string) => {
    if (!confirm("Tem certeza que deseja excluir este palpite permanentemente?")) return;

    const { error } = await supabase
      .from("copa_palpites")
      .delete()
      .eq("id", betId);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Palpite excluído com sucesso!" });
      fetchData();
    }
  };

  const handleUpdateResult = async (jogoId: string, h: number, a: number) => {
    const { error } = await supabase
      .from("copa_jogos")
      .update({ placar_home: h, placar_away: a, status: "finalizado" })
      .eq("id", jogoId);

    if (error) {
      toast({ title: "Erro ao atualizar placar", variant: "destructive" });
    } else {
      toast({ title: "Placar atualizado!" });
      fetchData();
    }
  };

  const handleSyncScores = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-copa-results');
      if (error) throw error;
      toast({ title: "Sincronização concluída", description: data.message || "Resultados atualizados com sucesso." });
      fetchData();
    } catch (error: any) {
      console.error("Erro ao sincronizar:", error);
      toast({ title: "Erro na sincronização", description: "Não foi possível conectar ao servidor de resultados.", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const filteredJogos = jogos.filter((j: any) => 
    j.time_home.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.time_away.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MasterLayout title="Gestão Copa O Morador">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 mb-6">
          <TabsList className="flex w-max min-w-full rounded-[20px] bg-muted/50 p-1">
            <TabsTrigger value="pagamentos" className="rounded-[16px] px-6 py-2 text-[10px] uppercase font-black whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Pendentes
            </TabsTrigger>
            <TabsTrigger value="confirmados" className="rounded-[16px] px-6 py-2 text-[10px] uppercase font-black whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Confirmados
            </TabsTrigger>
            <TabsTrigger value="jogos" className="rounded-[16px] px-6 py-2 text-[10px] uppercase font-black whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Resultados
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pagamentos" className="space-y-6">
          {["placar", "campeao", "bolao", "recharge"].map((tipo) => {
            const palpitesDoTipo = palpites.filter(p => p.status_pagamento === "pendente" && p.tipo === tipo);
            if (palpitesDoTipo.length === 0) return null;

            return (
              <div key={tipo} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {tipo === 'placar' ? 'Placar Exato' : tipo === 'campeao' ? 'Campeão' : tipo === 'bolao' ? 'Bolão Geral' : 'Recarga de Saldo'}
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-bold ml-auto">
                    {palpitesDoTipo.length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {palpitesDoTipo.map((p: any) => (
                    <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#1a2e25] rounded-[24px] border border-white/5 shadow-xl transition-all hover:border-primary/20 gap-4">
                      <div className="flex flex-1 items-center gap-4 min-w-0 w-full">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-black text-white truncate">{p.profiles?.nome || "Morador"}</p>
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black h-5 px-2 rounded-lg shrink-0">
                              R$ {Number(p.valor_pago).toFixed(2)}
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">
                              {tipo === 'recharge' ? 'Créditos para conta' : `${p.copa_jogos?.time_home} vs ${p.copa_jogos?.time_away}`}
                            </p>
                            {p.palpite_valor && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-primary uppercase italic">Palpite:</span>
                                <div className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                                  {tipo === 'placar' 
                                    ? (p.palpite_valor?.h !== undefined ? `${p.palpite_valor.h} x ${p.palpite_valor.a}` : 'Pendente')
                                    : tipo === 'campeao' 
                                    ? (typeof p.palpite_valor?.campeao === 'string' ? p.palpite_valor.campeao : 'Não definido')
                                    : tipo === 'bolao'
                                    ? "Participando do Bolão Geral"
                                    : tipo === 'recharge'
                                    ? "Recarga de Saldo"
                                    : JSON.stringify(p.palpite_valor)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprovePayment(p.id)} 
                          className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg shadow-primary/20"
                        >
                          Confirmar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteBet(p.id)} 
                          className="flex-1 sm:flex-initial text-red-500 hover:text-red-400 hover:bg-red-500/10 font-black text-[10px] uppercase h-10 px-4 rounded-xl"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {palpites.filter(p => p.status_pagamento === "pendente").length === 0 && (
            <div className="text-center py-12 bg-muted/10 rounded-[32px] border-2 border-dashed border-muted/20">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Nenhum pagamento pendente</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmados" className="space-y-4">
          <div className="space-y-3 p-0">
            {palpites.filter(p => p.status_pagamento === "pago").map((p: any) => (
                <div key={p.id} className="flex flex-col p-4 bg-[#1a2e25] rounded-[24px] border border-white/5 opacity-80 gap-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-white truncate">{p.profiles?.nome || "Morador"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black italic mt-1">
                        {p.tipo === 'placar' ? 'Placar Exato' : p.tipo === 'campeao' ? 'Campeão' : p.tipo === 'bolao' ? 'Bolão Geral' : p.tipo === 'recharge' ? 'Recarga de Saldo' : p.tipo} • R$ {Number(p.valor_pago).toFixed(2)}
                      </p>
                      {p.palpite_valor && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-black text-primary uppercase italic">Palpite:</span>
                          <div className="bg-white/5 px-2 py-0.5 rounded text-[9px] font-bold text-white">
                            {p.tipo === 'placar' 
                              ? (p.palpite_valor?.h !== undefined ? `${p.palpite_valor.h} x ${p.palpite_valor.a}` : 'Pendente')
                              : p.tipo === 'campeao' 
                              ? (typeof p.palpite_valor?.campeao === 'string' ? p.palpite_valor.campeao : 'Não definido')
                              : p.tipo === 'bolao'
                              ? "Participando do Bolão Geral"
                              : JSON.stringify(p.palpite_valor)}
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge className="bg-success/20 text-success border-none text-[9px] font-black uppercase shrink-0">
                      Aprovado
                    </Badge>
                  </div>
                </div>
              ))}
              {palpites.filter(p => p.status_pagamento === "pago").length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Nenhum pagamento confirmado ainda.</p>
              )}
          </div>
        </TabsContent>

        <TabsContent value="jogos" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Input 
                placeholder="Buscar país (Ex: Brasil)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </div>
            <Button variant="outline" onClick={handleSyncScores} disabled={syncing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>
          
          {filteredJogos.map((j: any) => (
            <Card key={j.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[9px] font-bold uppercase">{j.rodada}</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {new Date(j.data_jogo).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1"><p className="font-bold text-sm">{j.time_home}</p></div>
                  <div className="flex items-center gap-2 px-4">
                    <Input className="w-12 text-center h-8" defaultValue={j.placar_home ?? ""} id={`h-${j.id}`} />
                    <span className="font-bold">x</span>
                    <Input className="w-12 text-center h-8" defaultValue={j.placar_away ?? ""} id={`a-${j.id}`} />
                  </div>
                  <div className="text-center flex-1"><p className="font-bold text-sm">{j.time_away}</p></div>
                </div>
                <Button size="sm" className="w-full" onClick={() => {
                  const h = parseInt((document.getElementById(`h-${j.id}`) as HTMLInputElement).value);
                  const a = parseInt((document.getElementById(`a-${j.id}`) as HTMLInputElement).value);
                  handleUpdateResult(j.id, h, a);
                }}>
                  Salvar Resultado
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </MasterLayout>
  );
};

export default MasterCopaBets;
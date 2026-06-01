import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, CheckCircle2, Clock, Users, Plus, Trash2, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    const { error } = await supabase
      .from("copa_palpites")
      .update({ status_pagamento: "pago" })
      .eq("id", betId);

    if (error) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pagamento aprovado!" });
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
      
      toast({ 
        title: "Sincronização concluída", 
        description: data.message || "Resultados atualizados com sucesso." 
      });
      fetchData();
    } catch (error: any) {
      console.error("Erro ao sincronizar:", error);
      toast({ 
        title: "Erro na sincronização", 
        description: "Não foi possível conectar ao servidor de resultados. Tente novamente mais tarde.", 
        variant: "destructive" 
      });
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
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="jogos">Resultados Jogos</TabsTrigger>
        </TabsList>

        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users size={18} /> Pendentes de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {palpites.filter(p => p.status_pagamento === "pendente").map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 shadow-sm transition-all hover:bg-muted/40">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-foreground">{p.profiles?.nome || "Morador"}</p>
                      <Badge variant="outline" className="text-[9px] font-bold h-4">
                        R$ {Number(p.valor_pago).toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight italic">
                        {p.tipo === 'placar' ? 'Placar Exato' : p.tipo === 'artilheiro' ? 'Artilheiro' : p.tipo === 'campeao' ? 'Campeão' : 'Artilheiro BR'}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-medium">
                        {p.copa_jogos?.time_home} vs {p.copa_jogos?.time_away}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleApprovePayment(p.id)} 
                    className="bg-success hover:bg-success/90 text-white font-bold rounded-lg shadow-sm"
                  >
                    Confirmar Pago
                  </Button>
                </div>
              ))}
              {palpites.filter(p => p.status_pagamento === "pendente").length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Nenhum pagamento pendente.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={18} className="text-success" /> Pagamentos Confirmados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {palpites.filter(p => p.status_pagamento === "pago").slice(0, 10).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20 opacity-80">
                  <div className="space-y-1">
                    <p className="text-xs font-bold">{p.profiles?.nome || "Morador"}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-black italic">
                      {p.tipo === 'placar' ? 'Placar Exato' : p.tipo} • R$ {Number(p.valor_pago).toFixed(2)}
                    </p>
                  </div>
                  <Badge className="bg-success/20 text-success border-none text-[9px] font-black uppercase">
                    Aprovado
                  </Badge>
                </div>
              ))}
              {palpites.filter(p => p.status_pagamento === "pago").length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Nenhum pagamento confirmado ainda.</p>
              )}
            </CardContent>
          </Card>
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
            <Button 
              variant="outline" 
              onClick={handleSyncScores} 
              disabled={syncing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>
          
          {filteredJogos.map((j: any) => (
            <Card key={j.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[9px] font-bold uppercase">
                    {j.rodada}
                  </Badge>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {new Date(j.data_jogo).toLocaleString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>

                {(j.estadio || j.local) && (
                  <div className="text-center mb-3 text-[10px] text-muted-foreground">
                    📍 {j.estadio} {j.local && `— ${j.local}`}
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1">
                    <p className="font-bold text-sm">{j.time_home}</p>
                  </div>
                  <div className="flex items-center gap-2 px-4">
                    <Input 
                      className="w-12 text-center h-8" 
                      defaultValue={j.placar_home ?? ""} 
                      id={`h-${j.id}`}
                    />
                    <span className="font-bold">x</span>
                    <Input 
                      className="w-12 text-center h-8" 
                      defaultValue={j.placar_away ?? ""} 
                      id={`a-${j.id}`}
                    />
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-bold text-sm">{j.time_away}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full" 
                  onClick={() => {
                    const h = parseInt((document.getElementById(`h-${j.id}`) as HTMLInputElement).value);
                    const a = parseInt((document.getElementById(`a-${j.id}`) as HTMLInputElement).value);
                    handleUpdateResult(j.id, h, a);
                  }}
                >
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

import AdminLayout from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CheckCircle2, DollarSign, Wallet, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminFinanceiro = () => {
  const { roles } = useAuth();
  const condominioId = roles.find((r) => r.role === "admin")?.condominio_id;
  const [palpites, setPalpites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Fetching financeiro data for condominioId:", condominioId);
      
      let query = supabase
        .from("copa_palpites")
        .select(`
          *,
          profiles:user_id (nome),
          copa_jogos:jogo_id (time_home, time_away)
        `)
        .order("created_at", { ascending: false });

      // Desativando filtro de condomínio temporariamente para garantir visibilidade total
      /*
      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }
      */

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching palpites:", error);
        throw error;
      }
      
      console.log("Fetched palpites:", data?.length);
      setPalpites(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados financeiros");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [condominioId]);

  const handleApprovePayment = async (betId: string) => {
    try {
      // 1. Get the bet details first to know the amount and user
      const { data: bet, error: fetchError } = await supabase
        .from("copa_palpites")
        .select("valor_pago, user_id, status_pagamento")
        .eq("id", betId)
        .single();

      if (fetchError || !bet) throw new Error("Aposta não encontrada");
      
      // If already paid, don't repeat the credit addition
      if (bet.status_pagamento === "pago") {
        toast.info("Este pagamento já foi aprovado.");
        return;
      }

      // 2. Update the bet status
      const { error: updateError } = await supabase
        .from("copa_palpites")
        .update({ status_pagamento: "pago", pago: true })
        .eq("id", betId);

      if (updateError) throw updateError;

      // 3. Add credit to user's profile saldo
      const valorAprovado = Number(bet.valor_pago) || 0;
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("saldo")
        .eq("user_id", bet.user_id)
        .single();

      if (profileError) throw profileError;

      const novoSaldo = (Number(profile.saldo) || 0) + valorAprovado;

      const { error: walletError } = await supabase
        .from("profiles")
        .update({ saldo: novoSaldo })
        .eq("user_id", bet.user_id);

      if (walletError) throw walletError;
      
      toast.success(`Pagamento aprovado! R$ ${valorAprovado.toFixed(2)} adicionado ao saldo do morador.`);
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao aprovar pagamento");
      console.error(error);
    }
  };

  const handleDeleteBet = async (betId: string) => {
    if (!confirm("Tem certeza que deseja excluir este palpite permanentemente?")) return;

    try {
      const { error } = await supabase
        .from("copa_palpites")
        .delete()
        .eq("id", betId);

      if (error) throw error;
      
      toast.success("Palpite excluído com sucesso!");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir palpite");
      console.error(error);
    }
  };

  const pendentes = palpites.filter(p => p.status_pagamento === "pendente");
  const confirmados = palpites.filter(p => p.status_pagamento === "pago");

  return (
    <AdminLayout title="Financeiro">
      <div className="p-4 space-y-6 pb-20">
        <header className="px-1">
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <DollarSign className="text-primary" size={32} />
            Gestão Financeira
          </h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">
            Controle de pagamentos e saldos da Copa
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-[32px] border-none bg-primary/5 shadow-soft">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">A Receber</p>
              <p className="text-2xl font-black">
                R$ {pendentes.reduce((acc, p) => acc + (Number(p.valor_pago) || 0), 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[32px] border-none bg-success/5 shadow-soft">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-success mb-1">Total Pago</p>
              <p className="text-2xl font-black">
                R$ {confirmados.reduce((acc, p) => acc + (Number(p.valor_pago) || 0), 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pendentes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-[20px] bg-muted/50 p-1">
            <TabsTrigger value="pendentes" className="rounded-[16px] data-[state=active]:bg-background data-[state=active]:shadow-sm text-[10px] uppercase font-black">
              Pendentes ({pendentes.length})
            </TabsTrigger>
            <TabsTrigger value="confirmados" className="rounded-[16px] data-[state=active]:bg-background data-[state=active]:shadow-sm text-[10px] uppercase font-black">
              Confirmados ({confirmados.length})
            </TabsTrigger>
            <TabsTrigger value="resultados" className="rounded-[16px] data-[state=active]:bg-background data-[state=active]:shadow-sm text-[10px] uppercase font-black">
              Resultados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="mt-6 space-y-4">
            {loading ? (
              <p className="text-center text-xs text-muted-foreground py-10">Carregando...</p>
            ) : pendentes.length > 0 ? (
              pendentes.map((p) => (
                <Card key={p.id} className="rounded-[24px] border-border/50 shadow-soft overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-black text-foreground truncate">{p.profiles?.nome || "Morador"}</p>
                        <div className="bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                          <p className="text-[11px] font-black text-primary leading-none">
                            R$ {Number(p.valor_pago).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[9px] text-primary font-black uppercase tracking-tight italic opacity-80">
                          {p.tipo === 'placar' ? 'Placar Exato' : p.tipo === 'campeao' ? 'Campeão' : p.tipo === 'bolao' ? 'Bolão Geral' : p.tipo === 'recharge' ? 'Recarga de Saldo' : p.tipo}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground truncate mt-0.5">
                          {p.tipo === 'recharge' ? 'Créditos para conta' : `Jogo: ${p.copa_jogos?.time_home || 'Jogo'} x ${p.copa_jogos?.time_away || 'Removido'}`}
                        </p>
                        {p.palpite_valor && (
                          <p className="text-[10px] font-black text-foreground/70 mt-0.5">
                            {p.tipo === 'placar' 
                              ? `Palpite: ${p.palpite_valor?.h ?? 0} x ${p.palpite_valor?.a ?? 0}` 
                              : p.tipo === 'campeao' 
                              ? `Escolha: ${typeof p.palpite_valor?.campeao === 'string' ? p.palpite_valor.campeao : 'Indefinida'}` 
                              : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button 
                        size="sm" 
                        onClick={() => handleApprovePayment(p.id)}
                        className="h-8 rounded-xl bg-success hover:bg-success/90 text-white font-black text-[9px] uppercase px-3 shadow-md shadow-success/10"
                      >
                        Confirmar
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleDeleteBet(p.id)}
                        className="h-8 w-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[32px] border-2 border-dashed border-muted/50">
                <Wallet className="text-muted-foreground/20 mb-3" size={40} />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Nenhum pagamento pendente</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="confirmados" className="mt-6 space-y-3">
            {confirmados.length > 0 ? (
              confirmados.slice(0, 20).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-success/5 rounded-[20px] border border-success/10">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-black truncate">{p.profiles?.nome || "Morador"}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-black italic">
                      {p.tipo === 'placar' ? 'Placar' : p.tipo} • R$ {Number(p.valor_pago).toFixed(2)}
                    </p>
                  </div>
                  <Badge className="bg-success text-white border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0">
                    Confirmado
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-muted-foreground py-10 italic">Nenhum pagamento confirmado ainda.</p>
            )}
          </TabsContent>

          <TabsContent value="resultados" className="mt-6 space-y-4">
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[32px] border-2 border-dashed border-muted/50 text-center px-6">
              <Trophy size={40} className="text-primary mb-3 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Os resultados dos jogos são atualizados automaticamente após o fim de cada partida.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceiro;
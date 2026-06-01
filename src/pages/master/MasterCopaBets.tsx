import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, CheckCircle2, Clock, Users, Plus, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MasterCopaBets = () => {
  const [activeTab, setActiveTab] = useState("pagamentos");
  const [jogos, setJogos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [palpites, setPalpites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const { data: jogosData } = await supabase.from("copa_jogos").select("*").order("data_jogo", { ascending: true });
    const { data: palpitesData } = await supabase
      .from("copa_palpites")
      .select("*, profiles:user_id(nome)")
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
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <div>
                    <p className="text-sm font-bold">{p.profiles?.nome || "Morador"}</p>
                    <p className="text-[11px] text-muted-foreground uppercase">
                      {p.tipo === 'placar_exato' ? 'Placar Exato' : p.tipo}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleApprovePayment(p.id)} className="bg-success hover:bg-success/90">
                    Confirmar Pago
                  </Button>
                </div>
              ))}
              {palpites.filter(p => p.status_pagamento === "pendente").length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Nenhum pagamento pendente.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jogos" className="space-y-4">
          <div className="relative mb-4">
            <Input 
              placeholder="Buscar país (Ex: Brasil)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>
          
          {filteredJogos.map((j: any) => (
            <Card key={j.id}>
              <CardContent className="pt-6">
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

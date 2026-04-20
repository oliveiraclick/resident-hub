import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Clock, Image, Calendar, DollarSign, AlertCircle, CreditCard } from "lucide-react";

interface Solicitacao {
  id: string;
  prestador_id: string;
  condominio_id: string;
  data_inicio: string;
  data_fim: string;
  tipo_arte: string;
  imagem_url: string | null;
  status: string;
  valor_total: number;
  created_at: string;
  prestador_nome?: string;
  condominio_nome?: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Aguardando pgto", variant: "secondary" },
  aprovado: { label: "Pago / Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
  ativo: { label: "Ativo", variant: "default" },
  expirado: { label: "Expirado", variant: "outline" },
};

const MasterBannerSolicitacoes = () => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastActions, setLastActions] = useState<Record<string, { acao: string; ator_nome: string; created_at: string }>>({});

  const fetchData = async () => {
    setLoading(true);
    const { data: solis } = await supabase
      .from("banner_solicitacoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!solis || solis.length === 0) {
      setSolicitacoes([]);
      setLoading(false);
      return;
    }

    // Enrich with names
    const prestadorIds = [...new Set(solis.map((s) => s.prestador_id))];
    const condominioIds = [...new Set(solis.map((s) => s.condominio_id))];

    const [{ data: prestadores }, { data: condominios }, { data: actions }] = await Promise.all([
      supabase.from("prestadores").select("id, user_id").in("id", prestadorIds),
      supabase.from("condominios").select("id, nome").in("id", condominioIds),
      supabase.rpc("get_banner_last_actions", {
        _banner_tipo: "solicitacao",
        _banner_ids: solis.map((s) => s.id),
      }),
    ]);

    let profileMap: Record<string, string> = {};
    if (prestadores && prestadores.length > 0) {
      const userIds = prestadores.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .in("user_id", userIds);
      if (profiles) {
        profileMap = Object.fromEntries(profiles.map((p) => [p.user_id, p.nome]));
      }
    }

    const prestadorNameMap: Record<string, string> = {};
    prestadores?.forEach((p) => {
      prestadorNameMap[p.id] = profileMap[p.user_id] || "Prestador";
    });

    const condoMap: Record<string, string> = {};
    condominios?.forEach((c) => {
      condoMap[c.id] = c.nome;
    });

    const actionMap: Record<string, any> = {};
    actions?.forEach((a: any) => { actionMap[a.banner_id] = a; });
    setLastActions(actionMap);

    const enriched = solis.map((s) => ({
      ...s,
      prestador_nome: prestadorNameMap[s.prestador_id] || "—",
      condominio_nome: condoMap[s.condominio_id] || "—",
    }));

    setSolicitacoes(enriched);
    setLoading(false);
  };

  const formatAcao = (acao: string) => {
    const map: Record<string, string> = {
      aprovado: "Aprovado", ativo: "Ativado", rejeitado: "Rejeitado",
      expirado: "Expirado", criado: "Solicitado",
    };
    return map[acao] || acao;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("banner_solicitacoes")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success(`Solicitação ${status === "aprovado" ? "aprovada" : "rejeitada"}!`);
      fetchData();
    }
  };

  if (loading) {
    return (
      <MasterLayout title="Solicitações de Banners">
        <p className="text-muted-foreground">Carregando...</p>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout title="Solicitações de Banners">
      <div className="max-w-lg mx-auto flex flex-col gap-3">
        {solicitacoes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
            <AlertCircle size={40} />
            <p>Nenhuma solicitação de banner</p>
          </div>
        ) : (
          solicitacoes.map((s) => {
            const st = statusMap[s.status] || statusMap.pendente;
            return (
              <Card key={s.id}>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{s.prestador_nome}</p>
                      <p className="text-xs text-muted-foreground">{s.condominio_nome}</p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-primary" />
                      <span>{new Date(s.data_inicio).toLocaleDateString("pt-BR")} - {new Date(s.data_fim).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={12} className="text-primary" />
                      <span>R$ {formatBRL(s.valor_total)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Image size={12} className="text-primary" />
                      <span>{s.tipo_arte === "propria" ? "Arte própria" : "Solicitar criação"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-muted-foreground" />
                      <span>{new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  {s.imagem_url && (
                    <img
                      src={s.imagem_url}
                      alt="Arte do banner"
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                  )}

                  {lastActions[s.id] && (
                    <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
                      {formatAcao(lastActions[s.id].acao)} por <strong className="text-foreground">{lastActions[s.id].ator_nome}</strong> em {new Date(lastActions[s.id].created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}

                  {s.status === "pendente" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1" onClick={() => updateStatus(s.id, "aprovado")}>
                        <CreditCard size={14} /> Confirmar Pgto
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => updateStatus(s.id, "rejeitado")}>
                        <X size={14} /> Rejeitar
                      </Button>
                    </div>
                  )}
                  {s.status === "aprovado" && (
                    <Button size="sm" className="w-full gap-1" onClick={() => updateStatus(s.id, "ativo")}>
                      ✅ Publicar banner agora
                    </Button>
                  )}
                  {s.status === "ativo" && (
                    <p className="text-[11px] text-green-600 font-medium border-t border-border pt-2">
                      ✅ Banner publicado e visível aos moradores
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </MasterLayout>
  );
};

export default MasterBannerSolicitacoes;

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBRL } from "@/lib/utils";
import { Check, X, User, Phone, Clock, CalendarDays, Users, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CotacaoRespostasViewProps {
  eventoId: string;
  userId: string;
  isCreator: boolean;
  onPrestadorSelected?: () => void;
}

interface CotacaoWithRespostas {
  id: string;
  categoria: string;
  data_evento: string;
  horario_inicio: string;
  horario_fim: string;
  qtd_pessoas: number;
  tipo_servico: string;
  observacoes: string | null;
  status: string;
  respostas: {
    id: string;
    prestador_id: string;
    valor: number;
    mensagem: string | null;
    disponivel: boolean;
    status: string;
    nome: string;
    telefone: string | null;
    avatar_url: string | null;
  }[];
}

const CotacaoRespostasView = ({ eventoId, userId, isCreator, onPrestadorSelected }: CotacaoRespostasViewProps) => {
  const [cotacoes, setCotacoes] = useState<CotacaoWithRespostas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCotacoes();
  }, [eventoId]);

  const fetchCotacoes = async () => {
    setLoading(true);
    const { data: cots } = await supabase
      .from("evento_cotacoes")
      .select("*")
      .eq("evento_id", eventoId)
      .order("created_at", { ascending: false });

    if (!cots || cots.length === 0) { setCotacoes([]); setLoading(false); return; }

    const cotIds = cots.map((c: any) => c.id);
    const { data: respostas } = await supabase
      .from("evento_cotacao_respostas")
      .select("*")
      .in("cotacao_id", cotIds)
      .order("valor", { ascending: true });

    // Get prestador profiles
    const prestadorIds = [...new Set((respostas || []).map((r: any) => r.prestador_id))];
    let profileMap = new Map();
    if (prestadorIds.length > 0) {
      const { data: prestadores } = await supabase
        .from("prestadores")
        .select("id, user_id")
        .in("id", prestadorIds);

      if (prestadores && prestadores.length > 0) {
        const userIds = prestadores.map((p: any) => p.user_id);
        const { data: profiles } = await supabase.rpc("get_evento_participant_profiles", { _user_ids: userIds });

        const prestadorUserMap = new Map((prestadores || []).map((p: any) => [p.id, p.user_id]));
        const userProfileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

        prestadorIds.forEach((pid) => {
          const uid = prestadorUserMap.get(pid);
          if (uid) profileMap.set(pid, userProfileMap.get(uid));
        });
      }
    }

    const enriched: CotacaoWithRespostas[] = cots.map((c: any) => ({
      ...c,
      respostas: (respostas || [])
        .filter((r: any) => r.cotacao_id === c.id)
        .map((r: any) => {
          const prof = profileMap.get(r.prestador_id);
          return {
            ...r,
            nome: prof?.nome || "Prestador",
            telefone: prof?.telefone || null,
            avatar_url: prof?.avatar_url || null,
          };
        }),
    }));

    setCotacoes(enriched);
    setLoading(false);
  };

  const handleAccept = async (cotacaoId: string, respostaId: string, prestadorId: string) => {
    // Accept this response, update evento with prestador_id
    const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
      supabase.from("evento_cotacao_respostas").update({ status: "aceita" } as any).eq("id", respostaId),
      supabase.from("evento_cotacoes").update({ status: "fechada" } as any).eq("id", cotacaoId),
      supabase.from("eventos_amigos").update({ prestador_id: prestadorId } as any).eq("id", eventoId),
    ]);

    if (e1 || e2 || e3) toast.error("Erro ao aceitar proposta");
    else {
      toast.success("Prestador contratado! 🎉");
      fetchCotacoes();
      onPrestadorSelected?.();
    }
  };

  const openWhatsApp = (telefone: string, nome: string) => {
    const msg = encodeURIComponent(`Olá ${nome}! Vi sua proposta no app Morador e gostaria de conversar sobre o serviço.`);
    window.open(`https://wa.me/${telefone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  const tipoLabel: Record<string, string> = {
    completo: "Serviço completo",
    simples: "Só o básico",
    premium: "Premium / VIP",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (cotacoes.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">📋 Cotações enviadas</p>

      {cotacoes.map((cot) => (
        <Card key={cot.id} className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div
              className="h-1.5 w-full"
              style={{
                background: cot.status === "fechada"
                  ? "hsl(var(--success))"
                  : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-light)))",
              }}
            />
            <div className="p-3 space-y-2">
              {/* Cotação header */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">🔍 {cot.categoria}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cot.status === "fechada" ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
                  {cot.status === "fechada" ? "✅ Fechada" : `${cot.respostas.length} proposta${cot.respostas.length !== 1 ? "s" : ""}`}
                </span>
              </div>

              {/* Details */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays size={10} /> {format(new Date(cot.data_evento + "T00:00:00"), "dd/MM", { locale: ptBR })}</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {cot.horario_inicio.slice(0, 5)}-{cot.horario_fim.slice(0, 5)}</span>
                <span className="flex items-center gap-1"><Users size={10} /> {cot.qtd_pessoas}</span>
                <span>🍽️ {tipoLabel[cot.tipo_servico] || cot.tipo_servico}</span>
              </div>

              {/* Respostas */}
              {cot.respostas.length === 0 ? (
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">⏳ Aguardando propostas dos prestadores...</p>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  {cot.respostas.map((r) => (
                    <div
                      key={r.id}
                      className={`rounded-xl p-3 border ${
                        r.status === "aceita"
                          ? "bg-green-50 border-green-200"
                          : r.disponivel
                          ? "bg-card border-border"
                          : "bg-muted/30 border-border/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden shrink-0">
                            {r.avatar_url ? (
                              <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={12} className="text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{r.nome}</p>
                            {!r.disponivel && <p className="text-[10px] text-destructive">Indisponível</p>}
                          </div>
                        </div>
                        {r.disponivel && (
                          <p className="text-sm font-bold text-primary">R$ {formatBRL(r.valor)}</p>
                        )}
                      </div>

                      {r.mensagem && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 ml-9">💬 {r.mensagem}</p>
                      )}

                      {/* Actions */}
                      {isCreator && r.disponivel && r.status !== "aceita" && cot.status === "aberta" && (
                        <div className="flex gap-2 mt-2 ml-9">
                          <Button size="sm" className="flex-1 gap-1 h-8 text-xs" onClick={() => handleAccept(cot.id, r.id, r.prestador_id)}>
                            <Check size={12} /> Contratar
                          </Button>
                          {r.telefone && (
                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => openWhatsApp(r.telefone!, r.nome)}>
                              <Phone size={12} /> WhatsApp
                            </Button>
                          )}
                        </div>
                      )}

                      {r.status === "aceita" && (
                        <div className="flex items-center gap-1 mt-2 ml-9 text-[11px] text-green-600 font-semibold">
                          <Check size={12} /> Contratado!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CotacaoRespostasView;

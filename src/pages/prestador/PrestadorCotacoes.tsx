import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBRL } from "@/lib/utils";
import { Clock, Check, X, Users, CalendarDays, MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

interface Cotacao {
  id: string;
  evento_id: string;
  categoria: string;
  data_evento: string;
  horario_inicio: string;
  horario_fim: string;
  qtd_pessoas: number;
  tipo_servico: string;
  observacoes: string | null;
  status: string;
  created_at: string;
  criador_nome?: string;
  evento_titulo?: string;
  minha_resposta?: {
    id: string;
    valor: number;
    mensagem: string | null;
    disponivel: boolean;
    status: string;
  } | null;
}

const PrestadorCotacoes = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [prestadorId, setPrestadorId] = useState<string | null>(null);

  // Response dialog
  const [respondOpen, setRespondOpen] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState<Cotacao | null>(null);
  const [resValor, setResValor] = useState("");
  const [resMensagem, setResMensagem] = useState("");
  const [resDisponivel, setResDisponivel] = useState(true);
  const [resSaving, setResSaving] = useState(false);

  useEffect(() => {
    if (!user || !condominioId) return;
    fetchData();
  }, [user, condominioId]);

  const fetchData = async () => {
    setLoading(true);

    // Get my prestador id
    const { data: prest } = await supabase
      .from("prestadores")
      .select("id, especialidade")
      .eq("user_id", user!.id)
      .eq("condominio_id", condominioId!)
      .limit(1)
      .maybeSingle();

    if (!prest) { setLoading(false); return; }
    setPrestadorId(prest.id);

    // Get cotacoes matching my especialidade in my condominio
    const { data: cots } = await supabase
      .from("evento_cotacoes")
      .select("*")
      .eq("condominio_id", condominioId!)
      .eq("status", "aberta")
      .ilike("categoria", `%${prest.especialidade}%`)
      .order("created_at", { ascending: false });

    if (!cots || cots.length === 0) { setCotacoes([]); setLoading(false); return; }

    // Get my responses
    const cotIds = cots.map((c: any) => c.id);
    const { data: respostas } = await supabase
      .from("evento_cotacao_respostas")
      .select("*")
      .in("cotacao_id", cotIds)
      .eq("prestador_id", prest.id);

    const respostaMap = new Map((respostas || []).map((r: any) => [r.cotacao_id, r]));

    // Get creator profiles
    const creatorIds = [...new Set(cots.map((c: any) => c.criador_id))];
    const { data: profiles } = await supabase.rpc("get_evento_participant_profiles", { _user_ids: creatorIds });
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Get event titles
    const eventoIds = [...new Set(cots.map((c: any) => c.evento_id))];
    const { data: eventos } = await supabase
      .from("eventos_amigos")
      .select("id, titulo")
      .in("id", eventoIds);
    const eventoMap = new Map((eventos || []).map((e: any) => [e.id, e.titulo]));

    const enriched: Cotacao[] = cots.map((c: any) => ({
      ...c,
      criador_nome: profileMap.get(c.criador_id)?.nome || "Morador",
      evento_titulo: eventoMap.get(c.evento_id) || "Evento",
      minha_resposta: respostaMap.get(c.id) || null,
    }));

    setCotacoes(enriched);
    setLoading(false);
  };

  const openRespond = (cot: Cotacao) => {
    setSelectedCotacao(cot);
    if (cot.minha_resposta) {
      setResValor(String(cot.minha_resposta.valor));
      setResMensagem(cot.minha_resposta.mensagem || "");
      setResDisponivel(cot.minha_resposta.disponivel);
    } else {
      setResValor("");
      setResMensagem("");
      setResDisponivel(true);
    }
    setRespondOpen(true);
  };

  const handleRespond = async () => {
    if (!prestadorId || !selectedCotacao) return;
    const valor = parseFloat(resValor.replace(",", "."));
    if (resDisponivel && (isNaN(valor) || valor <= 0)) {
      toast.error("Informe um valor válido");
      return;
    }

    setResSaving(true);

    if (selectedCotacao.minha_resposta) {
      // Update
      const { error } = await supabase
        .from("evento_cotacao_respostas")
        .update({
          valor: resDisponivel ? valor : 0,
          mensagem: resMensagem.trim() || null,
          disponivel: resDisponivel,
        } as any)
        .eq("id", selectedCotacao.minha_resposta.id);

      if (error) toast.error("Erro ao atualizar");
      else { toast.success("Resposta atualizada!"); setRespondOpen(false); fetchData(); }
    } else {
      // Insert
      const { error } = await supabase
        .from("evento_cotacao_respostas")
        .insert({
          cotacao_id: selectedCotacao.id,
          prestador_id: prestadorId,
          valor: resDisponivel ? valor : 0,
          mensagem: resMensagem.trim() || null,
          disponivel: resDisponivel,
        } as any);

      if (error) toast.error("Erro ao enviar");
      else { toast.success("Proposta enviada! 🎉"); setRespondOpen(false); fetchData(); }
    }
    setResSaving(false);
  };

  const tipoLabel: Record<string, string> = {
    completo: "Serviço completo",
    simples: "Só o básico",
    premium: "Premium / VIP",
  };

  return (
    <PrestadorLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">📋 Cotações</h1>
          <p className="text-xs text-muted-foreground">Moradores buscando serviços como o seu</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando cotações...</p>
          </div>
        ) : cotacoes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))" }}>
              <MessageSquare size={36} className="text-primary/50" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Nenhuma cotação no momento</p>
              <p className="text-sm text-muted-foreground mt-1">Quando moradores buscarem serviços como o seu, aparecerá aqui!</p>
            </div>
          </div>
        ) : (
          cotacoes.map((cot, idx) => (
            <Card
              key={cot.id}
              className="border-none shadow-md overflow-hidden animate-fade-in"
              style={{ animationDelay: `${0.1 * idx}s` }}
            >
              <CardContent className="p-0">
                <div className="h-1.5 w-full" style={{ background: cot.minha_resposta ? "hsl(var(--success))" : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-light)))" }} />
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{cot.evento_titulo}</p>
                      <p className="text-[11px] text-muted-foreground">por {cot.criador_nome}</p>
                    </div>
                    {cot.minha_resposta ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">
                        {cot.minha_resposta.status === "aceita" ? "✅ Aceita" : "Respondida"}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">Nova</span>
                    )}
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays size={12} />
                      <span>{format(new Date(cot.data_evento + "T00:00:00"), "dd MMM yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={12} />
                      <span>{cot.horario_inicio.slice(0, 5)} - {cot.horario_fim.slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users size={12} />
                      <span>{cot.qtd_pessoas} pessoas</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      🍽️ {tipoLabel[cot.tipo_servico] || cot.tipo_servico}
                    </div>
                  </div>

                  {cot.observacoes && (
                    <div className="bg-muted/50 rounded-xl p-2.5 text-xs text-muted-foreground">
                      💬 {cot.observacoes}
                    </div>
                  )}

                  {/* My response summary */}
                  {cot.minha_resposta && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-semibold text-green-700">
                        {cot.minha_resposta.disponivel
                          ? `Sua proposta: R$ ${formatBRL(cot.minha_resposta.valor)}`
                          : "Você informou indisponibilidade"}
                      </p>
                      {cot.minha_resposta.mensagem && (
                        <p className="text-[11px] text-green-600">{cot.minha_resposta.mensagem}</p>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    variant={cot.minha_resposta ? "outline" : "default"}
                    onClick={() => openRespond(cot)}
                  >
                    {cot.minha_resposta ? (
                      <><Check size={14} /> Editar resposta</>
                    ) : (
                      <><Send size={14} /> Enviar proposta</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Respond dialog */}
      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send size={16} className="text-primary" />
              {selectedCotacao?.minha_resposta ? "Editar proposta" : "Enviar proposta"}
            </DialogTitle>
          </DialogHeader>
          {selectedCotacao && (
            <div className="flex flex-col gap-3">
              <div className="bg-muted/50 rounded-xl p-3 text-xs space-y-1">
                <p className="font-semibold text-foreground">{selectedCotacao.evento_titulo}</p>
                <p className="text-muted-foreground">
                  📅 {format(new Date(selectedCotacao.data_evento + "T00:00:00"), "dd/MM/yyyy")} · ⏰ {selectedCotacao.horario_inicio.slice(0, 5)}-{selectedCotacao.horario_fim.slice(0, 5)} · 👥 {selectedCotacao.qtd_pessoas} pessoas
                </p>
              </div>

              {/* Disponível? */}
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant={resDisponivel ? "default" : "outline"}
                  onClick={() => setResDisponivel(true)}
                  className="flex-1 gap-1"
                >
                  <Check size={14} /> Disponível
                </Button>
                <Button
                  size="sm"
                  variant={!resDisponivel ? "destructive" : "outline"}
                  onClick={() => setResDisponivel(false)}
                  className="flex-1 gap-1"
                >
                  <X size={14} /> Indisponível
                </Button>
              </div>

              {resDisponivel && (
                <Input
                  placeholder="Valor proposto (ex: 350,00)"
                  value={resValor}
                  onChange={(e) => setResValor(e.target.value)}
                  inputMode="decimal"
                />
              )}

              <Textarea
                placeholder="Mensagem (opcional) — ex: Incluo todo material, experiência de 5 anos..."
                value={resMensagem}
                onChange={(e) => setResMensagem(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleRespond} disabled={resSaving}>
              {resSaving ? "Enviando..." : resDisponivel ? "Enviar proposta 💰" : "Informar indisponibilidade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrestadorLayout>
  );
};

export default PrestadorCotacoes;

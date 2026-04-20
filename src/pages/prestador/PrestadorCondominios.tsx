import { useState, useEffect } from "react";
import PrestadorLayout from "@/components/PrestadorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, Plus, Clock, DollarSign, Copy, Check, Loader2, ExternalLink, Zap } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface Vinculo {
  id: string;
  condominio_id: string;
  status: string;
  is_primeiro: boolean;
  trial_fim: string | null;
  pagamento_status: string | null;
  pagamento_comprovante_url: string | null;
  valor_mensal: number;
  condominio_nome?: string;
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  trial: { label: "🎁 Trial gratuito", cls: "bg-blue-100 text-blue-700" },
  ativo: { label: "✅ Ativo", cls: "bg-green-100 text-green-700" },
  pendente_pagamento: { label: "💳 Aguardando pagamento", cls: "bg-amber-100 text-amber-700" },
  expirado: { label: "Expirado", cls: "bg-red-100 text-red-700" },
};

const PrestadorCondominios = () => {
  const { user } = useAuth();
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [condominios, setCondominios] = useState<{ id: string; nome: string }[]>([]);
  const [preco, setPreco] = useState<{ valor_mensal_condominio_extra: number; chave_pix: string | null; tipo_chave_pix: string | null; link_pagamento_automatico: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCond, setSelectedCond] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [pagamentoDialog, setPagamentoDialog] = useState<Vinculo | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: vincs }, { data: conds }, { data: precoData }] = await Promise.all([
      (supabase as any).from("prestador_condominios").select("*").eq("prestador_user_id", user.id).order("created_at"),
      supabase.from("condominios").select("id, nome").order("nome"),
      (supabase as any).from("prestador_precos").select("*").maybeSingle(),
    ]);
    if (precoData) setPreco(precoData);
    const cMap: Record<string, string> = {};
    conds?.forEach((c) => { cMap[c.id] = c.nome; });
    setCondominios(conds || []);
    setVinculos((vincs || []).map((v: any) => ({ ...v, condominio_nome: cMap[v.condominio_id] || "—" })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const condominiosDisponiveis = condominios.filter(
    (c) => !vinculos.some((v) => v.condominio_id === c.id)
  );

  const solicitarNovo = async () => {
    if (!user || !selectedCond) { toast.error("Selecione um condomínio"); return; }
    setSubmitting(true);
    const { data, error } = await (supabase as any).from("prestador_condominios")
      .insert({ prestador_user_id: user.id, condominio_id: selectedCond })
      .select().single();
    setSubmitting(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setDialogOpen(false);
    setSelectedCond("");
    if (data.status === "trial") {
      toast.success("🎉 Acesso liberado em modo trial!");
    } else if (data.status === "ativo") {
      toast.success("✅ Acesso liberado!");
    } else {
      toast.info("Solicitação criada. Realize o pagamento para liberar o acesso.");
      setPagamentoDialog(data);
    }
    fetchData();
  };

  const enviarComprovante = async () => {
    if (!comprovanteFile || !pagamentoDialog) return;
    setSubmitting(true);
    const path = `assinaturas/${pagamentoDialog.id}.${comprovanteFile.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("recibos").upload(path, comprovanteFile, { upsert: true });
    if (upErr) { toast.error("Erro no upload"); setSubmitting(false); return; }
    const { data: urlData } = supabase.storage.from("recibos").getPublicUrl(path);
    const { error } = await (supabase as any).from("prestador_condominios")
      .update({ pagamento_comprovante_url: urlData.publicUrl }).eq("id", pagamentoDialog.id);
    setSubmitting(false);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Comprovante enviado! Aguarde aprovação.");
      setPagamentoDialog(null);
      setComprovanteFile(null);
      fetchData();
    }
  };

  const copyPix = () => {
    if (preco?.chave_pix) {
      navigator.clipboard.writeText(preco.chave_pix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PrestadorLayout title="Meus Condomínios" showBack>
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Condomínios atendidos</h2>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus size={14} /> Novo
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>
        ) : vinculos.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
            Você ainda não está vinculado a nenhum condomínio. Clique em "Novo" para começar — o primeiro vem com período de avaliação gratuito.
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {vinculos.map((v) => {
              const st = statusBadge[v.status] || statusBadge.expirado;
              return (
                <Card key={v.id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          <Building2 size={14} className="text-primary" /> {v.condominio_nome}
                        </p>
                        {v.is_primeiro && <span className="text-[10px] text-muted-foreground">Primeiro condomínio</span>}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      {v.trial_fim && v.status === "trial" && (
                        <span className="flex items-center gap-1"><Clock size={11} /> Até {new Date(v.trial_fim).toLocaleDateString("pt-BR")}</span>
                      )}
                      {v.valor_mensal > 0 && (
                        <span className="flex items-center gap-1"><DollarSign size={11} /> R$ {formatBRL(v.valor_mensal)}/mês</span>
                      )}
                    </div>
                    {v.status === "pendente_pagamento" && !v.pagamento_comprovante_url && (
                      <Button size="sm" className="w-full" onClick={() => setPagamentoDialog(v)}>
                        💳 Realizar pagamento
                      </Button>
                    )}
                    {v.pagamento_comprovante_url && v.status === "pendente_pagamento" && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
                        ⏳ Comprovante enviado, aguardando aprovação do administrador.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog Novo Condomínio */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Novo condomínio</DialogTitle>
              <DialogDescription className="text-xs">
                {vinculos.length === 0
                  ? "Seu primeiro condomínio inclui período de avaliação gratuito."
                  : `Condomínios adicionais têm cobrança mensal de R$ ${preco ? formatBRL(preco.valor_mensal_condominio_extra) : "—"}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Condomínio *</Label>
                <Select value={selectedCond} onValueChange={setSelectedCond}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {condominiosDisponiveis.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={solicitarNovo} disabled={submitting || !selectedCond} className="w-full">
                {submitting ? "Enviando…" : "Solicitar acesso"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Pagamento Pix */}
        <Dialog open={!!pagamentoDialog} onOpenChange={(o) => !o && setPagamentoDialog(null)}>
          <DialogContent className="max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Pagamento via Pix</DialogTitle>
              <DialogDescription className="text-xs">
                Pague R$ {pagamentoDialog ? formatBRL(pagamentoDialog.valor_mensal) : "—"} e envie o comprovante.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {preco?.link_pagamento_automatico && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 space-y-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                    <Zap size={13} /> Pagamento automático (recomendado)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Pague com cartão recorrente — liberação automática, sem envio de comprovante.
                  </p>
                  <Button
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => window.open(preco.link_pagamento_automatico!, "_blank")}
                  >
                    <ExternalLink size={13} /> Pagar agora
                  </Button>
                </div>
              )}

              {preco?.link_pagamento_automatico && preco?.chave_pix && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <div className="flex-1 h-px bg-border" /> ou pague via Pix manual <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {preco?.chave_pix ? (
                <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                  <p className="text-[11px] text-muted-foreground">Chave Pix ({preco.tipo_chave_pix || "—"}):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono break-all">{preco.chave_pix}</code>
                    <Button size="sm" variant="outline" onClick={copyPix} className="gap-1">
                      {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                    </Button>
                  </div>
                </div>
              ) : !preco?.link_pagamento_automatico ? (
                <p className="text-xs text-destructive">Forma de pagamento ainda não configurada. Contate o administrador.</p>
              ) : null}
              <div>
                <Label className="text-xs">Comprovante (imagem) *</Label>
                <Input className="mt-1" type="file" accept="image/*" onChange={(e) => setComprovanteFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={enviarComprovante} disabled={submitting || !comprovanteFile} className="w-full">
                {submitting ? "Enviando…" : "Enviar comprovante"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorCondominios;

import { useState, useEffect } from "react";
import MasterLayout from "@/components/MasterLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Clock, DollarSign, Building2, Save } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface Vinculo {
  id: string;
  prestador_user_id: string;
  condominio_id: string;
  status: string;
  is_primeiro: boolean;
  trial_inicio: string | null;
  trial_fim: string | null;
  pagamento_status: string | null;
  pagamento_comprovante_url: string | null;
  valor_mensal: number;
  created_at: string;
  prestador_nome?: string;
  prestador_email?: string;
  condominio_nome?: string;
}

interface Preco {
  id: string;
  valor_mensal_condominio_extra: number;
  trial_dias: number;
  chave_pix: string | null;
  tipo_chave_pix: string | null;
  link_pagamento_automatico: string | null;
}

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  trial: { label: "🎁 Trial", variant: "secondary" },
  ativo: { label: "✅ Ativo", variant: "default" },
  pendente_pagamento: { label: "💳 Aguardando Pgto", variant: "outline" },
  expirado: { label: "Expirado", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const MasterPrestadoresAssinaturas = () => {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [preco, setPreco] = useState<Preco | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("pendente_pagamento");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: precoData }, { data: vincData }] = await Promise.all([
      (supabase as any).from("prestador_precos").select("*").maybeSingle(),
      (supabase as any).from("prestador_condominios").select("*").order("created_at", { ascending: false }),
    ]);

    if (precoData) setPreco(precoData);

    if (vincData && vincData.length > 0) {
      const userIds: string[] = Array.from(new Set(vincData.map((v: any) => v.prestador_user_id as string)));
      const condIds: string[] = Array.from(new Set(vincData.map((v: any) => v.condominio_id as string)));
      const [{ data: profiles }, { data: condos }] = await Promise.all([
        supabase.from("profiles").select("user_id, nome").in("user_id", userIds),
        supabase.from("condominios").select("id, nome").in("id", condIds),
      ]);
      const pMap: Record<string, string> = {};
      profiles?.forEach((p: any) => { pMap[p.user_id] = p.nome; });
      const cMap: Record<string, string> = {};
      condos?.forEach((c: any) => { cMap[c.id] = c.nome; });
      setVinculos(vincData.map((v: any) => ({
        ...v,
        prestador_nome: pMap[v.prestador_user_id] || "—",
        condominio_nome: cMap[v.condominio_id] || "—",
      })));
    } else {
      setVinculos([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const savePreco = async () => {
    if (!preco) return;
    setSaving(true);
    const { error } = await (supabase as any).from("prestador_precos").update({
      valor_mensal_condominio_extra: preco.valor_mensal_condominio_extra,
      trial_dias: preco.trial_dias,
      chave_pix: preco.chave_pix,
      tipo_chave_pix: preco.tipo_chave_pix,
      link_pagamento_automatico: preco.link_pagamento_automatico,
      updated_at: new Date().toISOString(),
    }).eq("id", preco.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar"); else toast.success("Configurações salvas!");
  };

  const aprovarPagamento = async (id: string) => {
    const { error } = await (supabase as any).from("prestador_condominios")
      .update({ pagamento_status: "pago" }).eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Pagamento aprovado! Prestador liberado."); fetchData(); }
  };

  const rejeitarPagamento = async (id: string) => {
    if (!confirm("Rejeitar este pagamento?")) return;
    const { error } = await (supabase as any).from("prestador_condominios")
      .update({ pagamento_status: "rejeitado" }).eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Rejeitado"); fetchData(); }
  };

  const filtered = filter === "todos" ? vinculos : vinculos.filter((v) => v.status === filter);

  return (
    <MasterLayout>
      <div className="p-4 space-y-5 max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold text-foreground">Assinaturas de Prestadores</h2>

        {/* Configuração de preço */}
        {preco && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <DollarSign size={14} /> Configurações de cobrança
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Valor mensal condomínio extra (R$)</Label>
                  <Input
                    type="number" step="0.01" className="mt-1"
                    value={preco.valor_mensal_condominio_extra}
                    onChange={(e) => setPreco({ ...preco, valor_mensal_condominio_extra: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Dias de trial (1º condomínio)</Label>
                  <Input
                    type="number" className="mt-1"
                    value={preco.trial_dias}
                    onChange={(e) => setPreco({ ...preco, trial_dias: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Chave Pix</Label>
                  <Input
                    className="mt-1" placeholder="Sua chave Pix"
                    value={preco.chave_pix || ""}
                    onChange={(e) => setPreco({ ...preco, chave_pix: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Tipo da chave</Label>
                  <Input
                    className="mt-1" placeholder="cpf, email, telefone, aleatoria"
                    value={preco.tipo_chave_pix || ""}
                    onChange={(e) => setPreco({ ...preco, tipo_chave_pix: e.target.value })}
                  />
                </div>
              </div>
              <Button size="sm" onClick={savePreco} disabled={saving} className="gap-1.5">
                <Save size={14} /> {saving ? "Salvando…" : "Salvar configurações"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {[
            { v: "pendente_pagamento", l: "💳 Aguardando" },
            { v: "trial", l: "🎁 Trial" },
            { v: "ativo", l: "✅ Ativos" },
            { v: "todos", l: "Todos" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${filter === f.v ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}
            >
              {f.l}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Nenhum vínculo encontrado.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((v) => {
              const st = statusBadge[v.status] || statusBadge.expirado;
              return (
                <Card key={v.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{v.prestador_nome}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 size={11} /> {v.condominio_nome}
                          {v.is_primeiro && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-muted">1º vínculo</span>}
                        </p>
                      </div>
                      <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      {v.trial_fim && (
                        <div className="flex items-center gap-1">
                          <Clock size={11} /> Trial até {new Date(v.trial_fim).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                      {v.valor_mensal > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign size={11} /> R$ {formatBRL(v.valor_mensal)}/mês
                        </div>
                      )}
                    </div>
                    {v.pagamento_comprovante_url && (
                      <a href={v.pagamento_comprovante_url} target="_blank" rel="noreferrer" className="block">
                        <img src={v.pagamento_comprovante_url} alt="Comprovante" className="max-h-32 rounded-lg border border-border" />
                      </a>
                    )}
                    {v.status === "pendente_pagamento" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 gap-1" onClick={() => aprovarPagamento(v.id)}>
                          <Check size={14} /> Confirmar Pgto
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => rejeitarPagamento(v.id)}>
                          <X size={14} /> Rejeitar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MasterLayout>
  );
};

export default MasterPrestadoresAssinaturas;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface LancamentoRow {
  id: string;
  condominioId: string;
  condominioNome: string;
  descricao: string | null;
  tipo: string;
  valor: number;
  status: string;
  vencimento: string | null;
  createdAt: string;
}

interface Condominio {
  id: string;
  nome: string;
}

const MasterFinanceiro = () => {
  const [rows, setRows] = useState<LancamentoRow[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<LancamentoRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formCondominio, setFormCondominio] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formTipo, setFormTipo] = useState("receita");
  const [formValor, setFormValor] = useState("");
  const [formStatus, setFormStatus] = useState("pendente");
  const [formVencimento, setFormVencimento] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [lancRes, condRes] = await Promise.all([
      supabase.from("financeiro_lancamentos").select("*").order("created_at", { ascending: false }),
      supabase.from("condominios").select("id, nome"),
    ]);
    const lancamentos = lancRes.data || [];
    const conds = condRes.data || [];
    setCondominios(conds);
    const condMap = new Map(conds.map((c) => [c.id, c.nome]));

    setRows(lancamentos.map((l: any) => ({
      id: l.id,
      condominioId: l.condominio_id,
      condominioNome: condMap.get(l.condominio_id) || "—",
      descricao: l.descricao,
      tipo: l.tipo,
      valor: Number(l.valor),
      status: l.status,
      vencimento: l.vencimento,
      createdAt: l.created_at,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormCondominio(""); setFormDescricao(""); setFormTipo("receita");
    setFormValor(""); setFormStatus("pendente"); setFormVencimento("");
    setShowForm(false); setEditTarget(null);
  };

  const openEdit = (r: LancamentoRow) => {
    setEditTarget(r);
    setFormCondominio(r.condominioId);
    setFormDescricao(r.descricao || "");
    setFormTipo(r.tipo);
    setFormValor(r.valor.toString());
    setFormStatus(r.status);
    setFormVencimento(r.vencimento || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formCondominio || !formValor) { toast.error("Condomínio e valor são obrigatórios"); return; }
    setSaving(true);

    const payload = {
      condominio_id: formCondominio,
      descricao: formDescricao || null,
      tipo: formTipo,
      valor: parseFloat(formValor),
      status: formStatus,
      vencimento: formVencimento || null,
    };

    if (editTarget) {
      const { error } = await supabase.from("financeiro_lancamentos").update(payload).eq("id", editTarget.id);
      setSaving(false);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Lançamento atualizado");
    } else {
      const { error } = await supabase.from("financeiro_lancamentos").insert(payload);
      setSaving(false);
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Lançamento criado");
    }
    resetForm();
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("financeiro_lancamentos").delete().eq("id", deleteId);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Lançamento excluído"); fetchData(); }
    setDeleteId(null);
  };

  const totalGeral = rows.reduce((s, r) => s + r.valor, 0);

  return (
    <MasterLayout title="Financeiro">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Total geral</p>
          <p className="text-lg font-bold text-primary">R$ {totalGeral.toFixed(2).replace(".", ",")}</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="rounded-[var(--radius-button)]">
          <Plus size={16} className="mr-2" /> Novo Lançamento
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-[var(--radius-card)] mb-4">
          <CardContent className="p-4 space-y-3">
            <Select value={formCondominio} onValueChange={setFormCondominio}>
              <SelectTrigger className="h-[52px]"><SelectValue placeholder="Condomínio *" /></SelectTrigger>
              <SelectContent>
                {condominios.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Descrição" value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} className="h-[52px]" />
            <div className="flex gap-2">
              <Select value={formTipo} onValueChange={setFormTipo}>
                <SelectTrigger className="h-[52px] flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger className="h-[52px] flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input type="number" step="0.01" placeholder="Valor *" value={formValor} onChange={(e) => setFormValor(e.target.value)} className="h-[52px]" />
            <Input type="date" placeholder="Vencimento" value={formVencimento} onChange={(e) => setFormVencimento(e.target.value)} className="h-[52px]" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Salvando..." : editTarget ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum lançamento encontrado.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="rounded-[var(--radius-card)]">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{r.descricao || r.tipo}</p>
                    <p className="text-xs text-muted-foreground">{r.condominioNome}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-bold ${r.tipo === "receita" ? "text-primary" : "text-destructive"}`}>
                      R$ {r.valor.toFixed(2).replace(".", ",")}
                    </span>
                    <button onClick={() => openEdit(r)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Pencil size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => setDeleteId(r.id)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="capitalize">{r.status}</span>
                  {r.vencimento && <span>Venc: {new Date(r.vencimento).toLocaleDateString("pt-BR")}</span>}
                  <span>{new Date(r.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MasterLayout>
  );
};

export default MasterFinanceiro;

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Filter, Calendar, TrendingUp, TrendingDown, Plus, Pencil, Trash2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Lancamento {
  id: string;
  descricao: string | null;
  tipo: string;
  valor: number;
  status: string;
  vencimento: string | null;
  created_at: string;
}

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

const statusStyle: Record<string, string> = {
  pendente: "bg-warning/10 text-warning",
  pago: "bg-success/10 text-success",
  cancelado: "bg-destructive/10 text-destructive",
};

const PrestadorFinanceiro = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Lancamento | null>(null);
  const [formTipo, setFormTipo] = useState("receita");
  const [formDescricao, setFormDescricao] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formStatus, setFormStatus] = useState("pendente");
  const [formVencimento, setFormVencimento] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !condominioId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("prestadores")
        .select("id")
        .eq("user_id", user.id)
        .eq("condominio_id", condominioId)
        .maybeSingle();
      setPrestadorId(data?.id || null);
    };
    fetch();
  }, [user, condominioId]);

  const fetchLancamentos = async () => {
    if (!prestadorId || !condominioId) return;
    setLoading(true);
    const { data } = await supabase
      .from("financeiro_lancamentos")
      .select("id, descricao, tipo, valor, status, vencimento, created_at")
      .eq("condominio_id", condominioId)
      .eq("prestador_id", prestadorId)
      .order("created_at", { ascending: false });
    setLancamentos((data as Lancamento[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLancamentos();
  }, [prestadorId, condominioId]);

  const resetForm = () => {
    setFormTipo("receita");
    setFormDescricao("");
    setFormValor("");
    setFormStatus("pendente");
    setFormVencimento("");
    setEditTarget(null);
    setShowForm(false);
  };

  const openNew = (tipo: string) => {
    resetForm();
    setFormTipo(tipo);
    setShowForm(true);
  };

  const openEdit = (l: Lancamento) => {
    setEditTarget(l);
    setFormTipo(l.tipo);
    setFormDescricao(l.descricao || "");
    setFormValor(l.valor.toString());
    setFormStatus(l.status);
    setFormVencimento(l.vencimento || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formValor || !prestadorId || !condominioId) {
      toast.error("Valor é obrigatório");
      return;
    }
    setSaving(true);
    const payload = {
      condominio_id: condominioId,
      prestador_id: prestadorId,
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
      if (error) { toast.error("Erro ao criar lançamento"); return; }
      toast.success("Lançamento criado");
    }
    resetForm();
    fetchLancamentos();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("financeiro_lancamentos").delete().eq("id", deleteId);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Lançamento excluído"); fetchLancamentos(); }
    setDeleteId(null);
  };

  const filteredLancamentos = useMemo(() => {
    let filtered = lancamentos;
    if (filtroStatus !== "todos") {
      filtered = filtered.filter((l) => l.status === filtroStatus);
    }
    if (filtroPeriodo !== "todos") {
      const now = new Date();
      const start = new Date();
      if (filtroPeriodo === "7d") start.setDate(now.getDate() - 7);
      else if (filtroPeriodo === "30d") start.setDate(now.getDate() - 30);
      else if (filtroPeriodo === "90d") start.setDate(now.getDate() - 90);
      filtered = filtered.filter((l) => new Date(l.created_at) >= start);
    }
    return filtered;
  }, [lancamentos, filtroStatus, filtroPeriodo]);

  const receber = filteredLancamentos.filter((l) => l.tipo === "receita");
  const pagar = filteredLancamentos.filter((l) => l.tipo === "despesa");

  const totalReceber = receber.filter((l) => l.status === "pendente").reduce((s, l) => s + Number(l.valor), 0);
  const totalPagar = pagar.filter((l) => l.status === "pendente").reduce((s, l) => s + Number(l.valor), 0);
  const totalRecebido = receber.filter((l) => l.status === "pago").reduce((s, l) => s + Number(l.valor), 0);
  const totalPagoVal = pagar.filter((l) => l.status === "pago").reduce((s, l) => s + Number(l.valor), 0);
  const saldo = totalRecebido - totalPagoVal;

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const [activeTab, setActiveTab] = useState("receber");

  const renderList = (items: Lancamento[], emptyMsg: string, isReceita: boolean) => {
    if (!prestadorId) {
      return <p className="text-[13px] text-muted-foreground text-center py-8">Cadastro de prestador não encontrado.</p>;
    }
    if (loading) {
      return <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>;
    }
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-12">
          {isReceita ? <ArrowDownCircle size={40} className="text-muted-foreground" /> : <ArrowUpCircle size={40} className="text-muted-foreground" />}
          <p className="text-[14px] text-muted-foreground">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {items.map((l) => {
          const isVencido = l.status === "pendente" && l.vencimento && new Date(l.vencimento) < new Date();
          return (
            <Card key={l.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isReceita ? "bg-success/10" : "bg-destructive/10"}`}>
                  {isReceita ? <ArrowDownCircle size={18} className="text-success" /> : <ArrowUpCircle size={18} className="text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {l.descricao || (isReceita ? "Receita" : "Despesa")}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-muted-foreground">
                      {l.vencimento
                        ? `Venc: ${new Date(l.vencimento).toLocaleDateString("pt-BR")}`
                        : new Date(l.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    {isVencido && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
                        VENCIDO
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end gap-1">
                    <p className={`text-[14px] font-bold ${isReceita ? "text-success" : "text-destructive"}`}>
                      {isReceita ? "+" : "-"} {formatCurrency(Number(l.valor))}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle[l.status] || "bg-muted text-muted-foreground"}`}>
                      {statusLabel[l.status] || l.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => openEdit(l)} className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                      <Pencil size={12} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => setDeleteId(l.id)} className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                      <Trash2 size={12} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <PrestadorLayout title="Financeiro" showBack>
      <div className="flex flex-col gap-4">

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp size={16} className="text-success mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">A Receber</p>
              <p className="text-[14px] font-bold text-success mt-0.5">{formatCurrency(totalReceber)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingDown size={16} className="text-destructive mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">A Pagar</p>
              <p className="text-[14px] font-bold text-destructive mt-0.5">{formatCurrency(totalPagar)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <DollarSign size={16} className="text-primary mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Saldo</p>
              <p className={`text-[14px] font-bold mt-0.5 ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(saldo)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-success/5 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total Recebido</p>
            <p className="text-[13px] font-bold text-success">{formatCurrency(totalRecebido)}</p>
          </div>
          <div className="bg-destructive/5 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total Pago</p>
            <p className="text-[13px] font-bold text-destructive">{formatCurrency(totalPagoVal)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="h-9 flex-1 text-[12px]">
              <Filter size={14} className="mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger className="h-9 flex-1 text-[12px]">
              <Calendar size={14} className="mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo período</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="receber" className="text-[12px]">
              A Receber ({receber.length})
            </TabsTrigger>
            <TabsTrigger value="pagar" className="text-[12px]">
              A Pagar ({pagar.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receber">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button onClick={() => openNew("receita")} className="rounded-[var(--radius-button)]" variant="outline">
                <ArrowDownCircle size={16} className="mr-2 text-success" /> A Receber
              </Button>
              <Button onClick={() => openNew("despesa")} className="rounded-[var(--radius-button)]" variant="outline">
                <ArrowUpCircle size={16} className="mr-2 text-destructive" /> A Pagar
              </Button>
            </div>
            {renderList(receber, "Nenhuma conta a receber", true)}
          </TabsContent>

          <TabsContent value="pagar">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button onClick={() => openNew("receita")} className="rounded-[var(--radius-button)]" variant="outline">
                <ArrowDownCircle size={16} className="mr-2 text-success" /> A Receber
              </Button>
              <Button onClick={() => openNew("despesa")} className="rounded-[var(--radius-button)]" variant="outline">
                <ArrowUpCircle size={16} className="mr-2 text-destructive" /> A Pagar
              </Button>
            </div>
            {renderList(pagar, "Nenhuma conta a pagar", false)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-[95vw] rounded-[var(--radius-card)]">
          <DialogHeader>
            <DialogTitle className="text-[16px]">
              {editTarget ? "Editar Lançamento" : formTipo === "receita" ? "Nova Conta a Receber" : "Nova Conta a Pagar"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Descrição"
              value={formDescricao}
              onChange={(e) => setFormDescricao(e.target.value)}
              className="h-[48px]"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Valor *"
              value={formValor}
              onChange={(e) => setFormValor(e.target.value)}
              className="h-[48px]"
            />
            <Select value={formStatus} onValueChange={setFormStatus}>
              <SelectTrigger className="h-[48px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Vencimento"
              value={formVencimento}
              onChange={(e) => setFormVencimento(e.target.value)}
              className="h-[48px]"
            />
          </div>
          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="outline" onClick={resetForm} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Salvando..." : editTarget ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
    </PrestadorLayout>
  );
};

export default PrestadorFinanceiro;

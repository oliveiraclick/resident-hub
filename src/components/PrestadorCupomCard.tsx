import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Ticket, Pencil, X, Plus } from "lucide-react";

interface Cupom {
  id: string;
  codigo: string;
  desconto_percent: number;
  ativo: boolean;
  validade: string | null;
}

const PrestadorCupomCard = ({ prestadorId }: { prestadorId: string }) => {
  const [cupom, setCupom] = useState<Cupom | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [desconto, setDesconto] = useState("");
  const [validade, setValidade] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCupom = async () => {
    const { data } = await supabase
      .from("cupons_prestador")
      .select("*")
      .eq("prestador_id", prestadorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setCupom(data as Cupom | null);
    setLoading(false);
  };

  useEffect(() => {
    if (prestadorId) fetchCupom();
  }, [prestadorId]);

  const openEdit = () => {
    if (cupom) {
      setCodigo(cupom.codigo);
      setDesconto(String(cupom.desconto_percent));
      setValidade(cupom.validade || "");
    } else {
      setCodigo("");
      setDesconto("10");
      setValidade("");
    }
    setEditing(true);
  };

  const handleSave = async () => {
    if (!codigo.trim()) { toast.error("Informe o código do cupom"); return; }
    if (!desconto || Number(desconto) <= 0 || Number(desconto) > 100) { toast.error("Desconto deve ser entre 1% e 100%"); return; }
    setSubmitting(true);

    const payload = {
      codigo: codigo.trim().toUpperCase(),
      desconto_percent: Number(desconto),
      validade: validade || null,
      ativo: true,
    };

    if (cupom) {
      const { error } = await supabase.from("cupons_prestador").update(payload).eq("id", cupom.id);
      if (error) { toast.error("Erro ao atualizar cupom"); } else { toast.success("Cupom atualizado!"); }
    } else {
      const { error } = await supabase.from("cupons_prestador").insert({ ...payload, prestador_id: prestadorId });
      if (error) { toast.error("Erro ao criar cupom"); } else { toast.success("Cupom criado!"); }
    }
    setSubmitting(false);
    setEditing(false);
    fetchCupom();
  };

  const toggleAtivo = async (checked: boolean) => {
    if (!cupom) return;
    const { error } = await supabase.from("cupons_prestador").update({ ativo: checked }).eq("id", cupom.id);
    if (error) { toast.error("Erro ao alterar status"); } else {
      toast.success(checked ? "Cupom ativado!" : "Cupom desativado");
      fetchCupom();
    }
  };

  if (loading) return null;

  if (editing) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket size={16} className="text-primary" />
              <p className="text-[14px] font-semibold text-foreground">{cupom ? "Editar Cupom" : "Novo Cupom"}</p>
            </div>
            <button onClick={() => setEditing(false)}><X size={18} className="text-muted-foreground" /></button>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-muted-foreground ml-1">Código (ex: LUA10)</label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="MEUCUPOM" maxLength={20} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-muted-foreground ml-1">Desconto (%)</label>
            <Input type="number" value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder="10" min="1" max="100" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-muted-foreground ml-1">Validade (opcional)</label>
            <Input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={submitting} className="gap-1.5">
            {submitting ? "Salvando..." : "Salvar cupom"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!cupom) {
    return (
      <Card className="border-dashed border-primary/20 cursor-pointer active:scale-[0.98] transition-transform" onClick={openEdit}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Ticket size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-foreground">Criar cupom de desconto</p>
            <p className="text-[11px] text-muted-foreground">Atraia mais clientes com um código promocional</p>
          </div>
          <Plus size={18} className="text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cupom.ativo ? "border-primary/20 bg-primary/5" : ""}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${cupom.ativo ? "bg-primary/20" : "bg-muted"}`}>
          <Ticket size={20} className={cupom.ativo ? "text-primary" : "text-muted-foreground"} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-foreground">{cupom.codigo}</p>
          <p className="text-[12px] text-muted-foreground">
            {cupom.desconto_percent}% de desconto
            {cupom.validade ? ` · até ${new Date(cupom.validade + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
          </p>
        </div>
        <button onClick={openEdit} className="p-2">
          <Pencil size={14} className="text-muted-foreground" />
        </button>
        <Switch checked={cupom.ativo} onCheckedChange={toggleAtivo} />
      </CardContent>
    </Card>
  );
};

export default PrestadorCupomCard;

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, Plus, Pencil, Trash2, X } from "lucide-react";

interface Servico {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  status: string;
}

const PrestadorServicos = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const fetchServicos = async () => {
    if (!prestadorId) return;
    setLoading(true);
    const { data } = await supabase
      .from("servicos")
      .select("id, titulo, descricao, preco, status")
      .eq("prestador_id", prestadorId)
      .order("created_at", { ascending: false });
    setServicos((data as Servico[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (prestadorId) fetchServicos();
  }, [prestadorId]);

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setPreco("");
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (s: Servico) => {
    setTitulo(s.titulo);
    setDescricao(s.descricao || "");
    setPreco(s.preco != null ? String(s.preco) : "");
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !prestadorId || !condominioId) return;
    setSubmitting(true);

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      preco: preco ? parseFloat(preco) : null,
    };

    if (editingId) {
      const { error } = await supabase.from("servicos").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar serviço");
      } else {
        toast.success("Serviço atualizado!");
        resetForm();
        fetchServicos();
      }
    } else {
      const { error } = await supabase.from("servicos").insert({
        ...payload,
        prestador_id: prestadorId,
        condominio_id: condominioId,
        status: "ativo",
      });
      if (error) {
        toast.error("Erro ao criar serviço");
      } else {
        toast.success("Serviço criado!");
        resetForm();
        fetchServicos();
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("servicos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir serviço");
    } else {
      toast.success("Serviço excluído");
      fetchServicos();
    }
  };

  const handleToggleStatus = async (s: Servico) => {
    const newStatus = s.status === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase.from("servicos").update({ status: newStatus }).eq("id", s.id);
    if (error) {
      toast.error("Erro ao alterar status");
    } else {
      toast.success(`Serviço ${newStatus === "ativo" ? "ativado" : "desativado"}`);
      fetchServicos();
    }
  };

  return (
    <PrestadorLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-foreground">Meus Serviços</h2>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus size={16} />
              Novo
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-foreground">
                  {editingId ? "Editar Serviço" : "Novo Serviço"}
                </p>
                <button onClick={resetForm}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Título</label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nome do serviço" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Descrição</label>
                <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do serviço" rows={3} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Preço (R$)</label>
                <Input type="number" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" step="0.01" />
              </div>

              <Button onClick={handleSubmit} disabled={submitting || !titulo.trim()}>
                {submitting ? "Salvando..." : editingId ? "Salvar alterações" : "Criar serviço"}
              </Button>
            </CardContent>
          </Card>
        )}

        {!prestadorId ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Cadastro de prestador não encontrado.</p>
        ) : loading ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
        ) : servicos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Wrench size={40} className="text-muted-foreground" />
            <p className="text-[14px] text-muted-foreground">Nenhum serviço cadastrado</p>
          </div>
        ) : (
          servicos.map((s) => (
            <Card key={s.id} className={s.status === "inativo" ? "opacity-60" : ""}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{s.titulo}</p>
                    {s.descricao && <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{s.descricao}</p>}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${s.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {s.status}
                  </span>
                </div>

                {s.preco != null && (
                  <p className="text-[15px] font-bold text-primary">
                    R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => openEdit(s)}>
                    <Pencil size={14} />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => handleToggleStatus(s)}>
                    {s.status === "ativo" ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => handleDelete(s.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorServicos;

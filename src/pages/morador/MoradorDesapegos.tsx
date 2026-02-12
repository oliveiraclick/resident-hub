import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Repeat, Plus } from "lucide-react";

const MoradorDesapegos = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [desapegos, setDesapegos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDesapegos = async () => {
    if (!condominioId) return;
    setLoading(true);
    const { data } = await supabase
      .from("desapegos")
      .select("*")
      .eq("condominio_id", condominioId)
      .eq("status", "ativo")
      .order("created_at", { ascending: false });
    setDesapegos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDesapegos();
  }, [condominioId]);

  const handleSubmit = async () => {
    if (!titulo.trim() || !condominioId || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from("desapegos").insert({
      condominio_id: condominioId,
      user_id: user.id,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      preco: preco ? parseFloat(preco) : null,
      status: "ativo",
    });

    if (error) {
      toast.error("Erro ao publicar desapego");
    } else {
      toast.success("Desapego publicado!");
      setTitulo("");
      setDescricao("");
      setPreco("");
      setShowForm(false);
      fetchDesapegos();
    }
    setSubmitting(false);
  };

  return (
    <MoradorLayout title="Desapego">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
          <Plus size={18} />
          {showForm ? "Cancelar" : "Publicar Desapego"}
        </Button>

        {showForm && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div>
                <label className="mb-1 block">Título</label>
                <Input
                  placeholder="O que você quer desapegar?"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block">Descrição</label>
                <Input
                  placeholder="Detalhes do item"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block">Preço (opcional)</label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                />
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !titulo.trim()}>
                {submitting ? "Publicando..." : "Publicar"}
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : desapegos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Repeat size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhum desapego ainda</p>
          </div>
        ) : (
          desapegos.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <p className="text-title-md">{d.titulo}</p>
                {d.descricao && (
                  <p className="text-body text-muted-foreground">{d.descricao}</p>
                )}
                {d.preco ? (
                  <p className="text-body font-semibold text-primary">
                    R$ {Number(d.preco).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-subtitle text-success font-medium">Gratuito</p>
                )}
                <p className="text-label text-muted-foreground">
                  {new Date(d.created_at).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorDesapegos;

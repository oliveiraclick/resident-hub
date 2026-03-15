import { useEffect, useState } from "react";
import MasterLayout from "@/components/MasterLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Newspaper, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface NoticiaCategoria {
  id: string;
  nome: string;
  emoji: string;
  ativo: boolean;
  ordem: number;
}

const MasterNoticiasCategorias = () => {
  const [categorias, setCategorias] = useState<NoticiaCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmoji, setNovoEmoji] = useState("📰");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    const { data } = await supabase
      .from("noticias_categorias")
      .select("*")
      .order("ordem", { ascending: true });
    setCategorias((data as NoticiaCategoria[]) || []);
    setLoading(false);
  };

  const addCategoria = async () => {
    if (!novoNome.trim()) return;
    const ordem = categorias.length;
    const { error } = await supabase
      .from("noticias_categorias")
      .insert({ nome: novoNome.trim(), emoji: novoEmoji || "📰", ordem });
    if (error) {
      toast.error("Erro ao adicionar: " + error.message);
      return;
    }
    toast.success("Categoria adicionada!");
    setNovoNome("");
    setNovoEmoji("📰");
    fetchCategorias();
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from("noticias_categorias").update({ ativo }).eq("id", id);
    setCategorias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ativo } : c))
    );
  };

  const deleteCategoria = async (id: string) => {
    if (!confirm("Remover esta categoria?")) return;
    await supabase.from("noticias_categorias").delete().eq("id", id);
    toast.success("Categoria removida");
    fetchCategorias();
  };

  const gerarNoticias = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-noticias");
      if (error) throw error;
      toast.success(`Notícias geradas: ${data?.generated?.join(", ") || "OK"}`);
    } catch (e: any) {
      toast.error("Erro ao gerar: " + (e.message || "Erro desconhecido"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <MasterLayout title="Notícias - Categorias" showBack>
      <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Categorias de Notícias</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={gerarNoticias}
            disabled={generating}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Gerando..." : "Gerar Agora"}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Gerencie as categorias de notícias disponíveis para os moradores. Ative/desative conforme necessário.
        </p>

        {/* Add new */}
        <Card className="p-4">
          <p className="text-sm font-medium mb-3">Adicionar nova categoria</p>
          <div className="flex gap-2">
            <Input
              placeholder="Emoji"
              value={novoEmoji}
              onChange={(e) => setNovoEmoji(e.target.value)}
              className="w-16 text-center text-lg"
              maxLength={4}
            />
            <Input
              placeholder="Nome da categoria"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addCategoria()}
            />
            <Button onClick={addCategoria} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* List */}
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <div className="space-y-2">
            {categorias.map((cat) => (
              <Card
                key={cat.id}
                className={`p-3 flex items-center gap-3 transition-opacity ${
                  !cat.ativo ? "opacity-50" : ""
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                <span className="text-xl flex-shrink-0">{cat.emoji}</span>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {cat.nome}
                </span>
                <Switch
                  checked={cat.ativo}
                  onCheckedChange={(checked) => toggleAtivo(cat.id, checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteCategoria(cat.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <Card className="p-4 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            {categorias.filter((c) => c.ativo).length} categorias ativas de {categorias.length} total.
            As notícias são geradas automaticamente por IA com base nestas categorias.
          </p>
        </Card>
      </div>
    </MasterLayout>
  );
};

export default MasterNoticiasCategorias;

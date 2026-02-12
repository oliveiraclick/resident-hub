import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Star, Wrench } from "lucide-react";

interface Categoria {
  nome: string;
  count: number;
}

const MoradorServicos = () => {
  const { roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!condominioId) return;

    const fetchCategorias = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("prestadores")
        .select("especialidade")
        .eq("condominio_id", condominioId);

      if (data) {
        const map: Record<string, number> = {};
        data.forEach((p) => {
          map[p.especialidade] = (map[p.especialidade] || 0) + 1;
        });
        setCategorias(
          Object.entries(map).map(([nome, count]) => ({ nome, count }))
        );
      }
      setLoading(false);
    };

    fetchCategorias();
  }, [condominioId]);

  useEffect(() => {
    if (!condominioId || !selectedCategoria) return;

    const fetchServicos = async () => {
      const { data: prestadores } = await supabase
        .from("prestadores")
        .select("id, especialidade, descricao, user_id")
        .eq("condominio_id", condominioId)
        .eq("especialidade", selectedCategoria);

      if (!prestadores?.length) {
        setServicos([]);
        return;
      }

      const prestadorIds = prestadores.map((p) => p.id);
      const { data: servicosData } = await supabase
        .from("servicos")
        .select("*")
        .eq("condominio_id", condominioId)
        .in("prestador_id", prestadorIds)
        .eq("status", "ativo");

      setServicos(servicosData || []);
    };

    fetchServicos();
  }, [condominioId, selectedCategoria]);

  if (selectedCategoria) {
    return (
      <MoradorLayout title={selectedCategoria} showBack>
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          {servicos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Wrench size={40} className="text-muted-foreground" />
              <p className="text-body text-muted-foreground">
                Nenhum serviço nesta categoria
              </p>
            </div>
          ) : (
            servicos.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex flex-col gap-2 p-4">
                  <p className="text-title-md">{s.titulo}</p>
                  {s.descricao && (
                    <p className="text-body text-muted-foreground">{s.descricao}</p>
                  )}
                  {s.preco && (
                    <p className="text-body font-semibold text-primary">
                      R$ {Number(s.preco).toFixed(2)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          <button
            onClick={() => setSelectedCategoria(null)}
            className="text-body text-primary font-semibold py-2"
          >
            ← Voltar às categorias
          </button>
        </div>
      </MoradorLayout>
    );
  }

  return (
    <MoradorLayout title="Serviços">
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">
            Carregando...
          </p>
        ) : categorias.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Wrench size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">
              Nenhum prestador disponível
            </p>
          </div>
        ) : (
          categorias.map((cat) => (
            <Card
              key={cat.nome}
              className="cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => setSelectedCategoria(cat.nome)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-button bg-primary/10">
                  <Wrench size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-title-md">{cat.nome}</p>
                  <p className="text-subtitle text-muted-foreground">
                    {cat.count} prestador{cat.count > 1 ? "es" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorServicos;

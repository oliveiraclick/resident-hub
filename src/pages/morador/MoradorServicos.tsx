import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Star, Wrench, Search } from "lucide-react";

interface Categoria {
  nome: string;
  count: number;
}

const MoradorServicos = () => {
  const { roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [allPrestadores, setAllPrestadores] = useState<any[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(queryFromUrl);

  // Fetch all prestadores
  useEffect(() => {
    if (!condominioId) return;

    const fetchPrestadores = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("prestadores")
        .select("id, especialidade, descricao, user_id")
        .eq("condominio_id", condominioId);

      if (data) {
        setAllPrestadores(data);
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

    fetchPrestadores();
  }, [condominioId]);

  // Clear URL param after reading
  useEffect(() => {
    if (queryFromUrl) {
      setSearchTerm(queryFromUrl);
      setSearchParams({}, { replace: true });
    }
  }, [queryFromUrl]);

  useEffect(() => {
    if (!condominioId || !selectedCategoria) return;

    const fetchServicos = async () => {
      const prestadorIds = allPrestadores
        .filter((p) => p.especialidade === selectedCategoria)
        .map((p) => p.id);

      if (!prestadorIds.length) {
        setServicos([]);
        return;
      }

      const { data: servicosData } = await supabase
        .from("servicos")
        .select("*")
        .eq("condominio_id", condominioId)
        .in("prestador_id", prestadorIds)
        .eq("status", "ativo");

      setServicos(servicosData || []);
    };

    fetchServicos();
  }, [condominioId, selectedCategoria, allPrestadores]);

  // Filter categories by search term
  const filteredCategorias = searchTerm
    ? categorias.filter((cat) =>
        cat.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categorias;

  // Also show matching prestadores directly when searching
  const filteredPrestadores = searchTerm
    ? allPrestadores.filter(
        (p) =>
          p.especialidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

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
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Search within page */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por especialidade..."
            className="w-full h-11 rounded-full bg-muted pl-11 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground outline-none border-0 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">
            Carregando...
          </p>
        ) : filteredCategorias.length === 0 && filteredPrestadores.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Wrench size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">
              {searchTerm ? `Nenhum resultado para "${searchTerm}"` : "Nenhum prestador disponível"}
            </p>
          </div>
        ) : (
          filteredCategorias.map((cat) => (
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

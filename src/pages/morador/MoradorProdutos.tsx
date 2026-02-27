import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

const MoradorProdutos = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!condominioId) return;

    const fetchAll = async () => {
      setLoading(true);

      const [prodRes, servRes] = await Promise.all([
        supabase
          .from("produtos")
          .select("id, titulo, preco, status, imagem_url, descricao")
          .eq("condominio_id", condominioId)
          .eq("status", "ativo")
          .gt("preco", 0)
          .not("imagem_url", "is", null)
          .not("descricao", "is", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("servicos")
          .select("id, titulo, preco, status, descricao")
          .eq("condominio_id", condominioId)
          .eq("status", "ativo")
          .gt("preco", 0)
          .not("descricao", "is", null)
          .order("created_at", { ascending: false }),
      ]);

      const produtos = (prodRes.data || []).filter(p => p.imagem_url?.trim() && p.descricao?.trim()).map((p) => ({ ...p, _tipo: "Produto" as const }));
      const servicos = (servRes.data || []).filter(s => s.descricao?.trim()).map((s) => ({ ...s, _tipo: "Serviço" as const }));

      const merged: any[] = [];
      const maxLen = Math.max(produtos.length, servicos.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < produtos.length) merged.push(produtos[i]);
        if (i < servicos.length) merged.push(servicos[i]);
      }

      setItems(merged);
      setLoading(false);
    };

    fetchAll();
  }, [condominioId]);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  return (
    <MoradorLayout title="E-shop">
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <ShoppingBag size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhum produto ou serviço disponível</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {paginatedItems.map((item) => {
                const isServico = item._tipo === "Serviço";
                return (
                  <button
                    key={`${item._tipo}-${item.id}`}
                    onClick={() =>
                      isServico
                        ? navigate(`/morador/servicos?q=${encodeURIComponent(item.titulo)}`)
                        : navigate(`/morador/produtos/${item.id}`)
                    }
                    className="bg-transparent border-none cursor-pointer p-0 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm">
                      <div className="aspect-[4/3] overflow-hidden relative">
                        {item.imagem_url ? (
                          <img src={item.imagem_url} alt={item.titulo} className="w-full h-full object-cover" />
                        ) : isServico ? (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <Wrench size={40} className="text-primary/40" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ShoppingBag size={40} className="text-muted-foreground" />
                          </div>
                        )}
                        <Badge
                          className={`absolute top-2.5 left-2.5 text-[9px] uppercase tracking-wider font-bold ${
                            isServico ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {item._tipo}
                        </Badge>
                      </div>
                      <div className="p-3 pb-4">
                        <p className="text-[14px] font-semibold text-foreground m-0 truncate leading-snug">{item.titulo}</p>
                        {item.preco != null && (
                          <p className="text-[18px] font-extrabold text-primary mt-1.5 m-0 tracking-tight">
                            R$ {formatBRL(item.preco)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2 pb-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-[13px] text-muted-foreground min-w-[60px] text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorProdutos;

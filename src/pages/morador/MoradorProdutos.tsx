import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Wrench, ChevronLeft, ChevronRight, Package, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <MoradorLayout title="E-shop" showBack>
      <div className="flex flex-col gap-8 pb-20 max-w-2xl mx-auto">
        <header className="px-1">
          <h1 className="text-4xl font-black tracking-tight mb-2">Shop</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Produtos e ofertas locais</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-[32px]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-4 py-20 px-8 bg-card rounded-[40px] border border-dashed">
            <ShoppingBag size={48} className="text-muted-foreground/20" />
            <p className="text-muted-foreground font-bold">Nenhuma oferta disponível.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-4">
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
                    className="group bg-transparent border-none cursor-pointer p-0 text-left active:scale-[0.98] transition-all"
                  >
                    <Card className="border-none shadow-soft hover:shadow-premium rounded-[32px] overflow-hidden bg-card transition-all h-full">
                      <div className="aspect-[4/5] overflow-hidden relative">
                        {item.imagem_url ? (
                          <img src={item.imagem_url} alt={item.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                            {isServico ? <Wrench size={32} className="text-primary/20" /> : <ShoppingBag size={32} className="text-primary/20" />}
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-1.5">
                           <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border-none ${isServico ? "bg-indigo-500 text-white" : "bg-primary text-white"}`}>
                            {item._tipo}
                           </Badge>
                        </div>
                      </div>
                      <CardContent className="p-5 flex flex-col gap-2">
                        <p className="text-[15px] font-black text-foreground truncate leading-tight group-hover:text-primary transition-colors">{item.titulo}</p>
                        <div className="flex items-center justify-between mt-1">
                          {item.preco != null ? (
                            <p className="text-lg font-black text-foreground tracking-tighter">
                              R$ {formatBRL(item.preco)}
                            </p>
                          ) : (
                            <p className="text-xs font-bold text-muted-foreground uppercase">Consultar</p>
                          )}
                          <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                             <ArrowRight size={14} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-2xl border-2"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={20} />
                </Button>
                <div className="bg-muted px-5 py-2 rounded-full">
                   <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Pág {page} de {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-2xl border-2"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={20} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorProdutos;

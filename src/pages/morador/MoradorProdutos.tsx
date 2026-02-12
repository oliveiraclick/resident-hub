import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag } from "lucide-react";

const MoradorProdutos = () => {
  const { roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!condominioId) return;

    const fetchProdutos = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("produtos")
        .select("*")
        .eq("condominio_id", condominioId)
        .eq("status", "ativo")
        .order("created_at", { ascending: false });
      setProdutos(data || []);
      setLoading(false);
    };

    fetchProdutos();
  }, [condominioId]);

  return (
    <MoradorLayout title="E-shop">
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : produtos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <ShoppingBag size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhum produto disponível</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {produtos.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <CardContent className="flex flex-col gap-2 p-3">
                  <div className="flex h-24 items-center justify-center rounded-button bg-muted">
                    <ShoppingBag size={28} className="text-muted-foreground" />
                  </div>
                  <p className="text-body font-medium truncate">{p.titulo}</p>
                  {p.preco && (
                    <p className="text-body font-semibold text-primary">
                      R$ {Number(p.preco).toFixed(2)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorProdutos;

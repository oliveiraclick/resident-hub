import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning" },
  confirmado: { label: "Confirmado", color: "bg-primary/10 text-primary" },
  pronto: { label: "Pronto p/ retirada", color: "bg-accent/10 text-accent-foreground" },
  entregue: { label: "Entregue", color: "bg-success/10 text-success" },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive" },
};

const MoradorMeusPedidos = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("pedidos")
        .select("id, status, valor_total, observacoes, created_at, loja_id")
        .eq("morador_id", user.id)
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      // Get loja names
      const lojaIds = [...new Set(data.map(p => p.loja_id))];
      const { data: lojas } = lojaIds.length
        ? await supabase.from("lojas").select("id, nome").in("id", lojaIds)
        : { data: [] };
      const lojaMap = new Map((lojas || []).map((l: any) => [l.id, l.nome]));

      // Get itens
      const pedidoIds = data.map(p => p.id);
      const { data: itensData } = pedidoIds.length
        ? await supabase.from("pedido_itens").select("pedido_id, quantidade, preco_unitario, produto_id").in("pedido_id", pedidoIds)
        : { data: [] };

      const prodIds = [...new Set((itensData || []).map(i => i.produto_id))];
      const { data: prods } = prodIds.length
        ? await supabase.from("produtos").select("id, titulo").in("id", prodIds)
        : { data: [] };
      const prodMap = new Map((prods || []).map((p: any) => [p.id, p.titulo]));

      const enriched = data.map(p => ({
        ...p,
        loja_nome: lojaMap.get(p.loja_id) || "Loja",
        itens: (itensData || []).filter(i => i.pedido_id === p.id).map(i => ({
          titulo: prodMap.get(i.produto_id) || "Produto",
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
        })),
      }));

      setPedidos(enriched);
      setLoading(false);
    })();
  }, [user]);

  return (
    <MoradorLayout title="Meus Pedidos" showBack>
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <ClipboardList size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhum pedido realizado</p>
          </div>
        ) : (
          pedidos.map(p => {
            const st = STATUS_MAP[p.status] || { label: p.status, color: "bg-muted text-muted-foreground" };
            return (
              <Card key={p.id}>
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{p.loja_nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(p.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  {p.itens.length > 0 && (
                    <div className="flex flex-col gap-1 bg-muted/30 rounded-lg p-2">
                      {p.itens.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-[12px]">
                          <span className="text-foreground">{item.quantidade}x {item.titulo}</span>
                          <span className="text-muted-foreground">R$ {formatBRL(item.preco_unitario * item.quantidade)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[15px] font-bold text-primary">Total: R$ {formatBRL(p.valor_total)}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorMeusPedidos;

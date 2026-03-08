import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardList, Package } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning" },
  confirmado: { label: "Confirmado", color: "bg-primary/10 text-primary" },
  pronto: { label: "Pronto", color: "bg-accent/10 text-accent-foreground" },
  entregue: { label: "Entregue", color: "bg-success/10 text-success" },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive" },
};

const NEXT_STATUS: Record<string, string> = {
  pendente: "confirmado",
  confirmado: "pronto",
  pronto: "entregue",
};

interface Pedido {
  id: string;
  status: string;
  valor_total: number;
  observacoes: string | null;
  created_at: string;
  morador_nome?: string;
  itens?: { titulo: string; quantidade: number; preco_unitario: number }[];
}

const PrestadorPedidos = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [lojaId, setLojaId] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !condominioId) return;
    (async () => {
      const { data: prest } = await supabase
        .from("prestadores").select("id").eq("user_id", user.id).eq("condominio_id", condominioId).maybeSingle();
      if (!prest) return;
      const { data: loja } = await supabase
        .from("lojas").select("id").eq("prestador_id", prest.id).maybeSingle();
      setLojaId(loja?.id || null);
    })();
  }, [user, condominioId]);

  const fetchPedidos = async () => {
    if (!lojaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("pedidos")
      .select("id, status, valor_total, observacoes, created_at, morador_id")
      .eq("loja_id", lojaId)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const moradorIds = [...new Set(data.map(p => p.morador_id))];
    const { data: profiles } = await supabase.rpc("get_evento_participant_profiles", { _user_ids: moradorIds });
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.nome]));

    const pedidoIds = data.map(p => p.id);
    const { data: itensData } = await supabase
      .from("pedido_itens")
      .select("pedido_id, quantidade, preco_unitario, produto_id")
      .in("pedido_id", pedidoIds);

    const produtoIds = [...new Set((itensData || []).map(i => i.produto_id))];
    const { data: produtosData } = produtoIds.length
      ? await supabase.from("produtos").select("id, titulo").in("id", produtoIds)
      : { data: [] };
    const prodMap = new Map((produtosData || []).map((p: any) => [p.id, p.titulo]));

    const enriched: Pedido[] = data.map(p => ({
      id: p.id,
      status: p.status,
      valor_total: p.valor_total,
      observacoes: p.observacoes,
      created_at: p.created_at,
      morador_nome: profileMap.get(p.morador_id) as string || "Morador",
      itens: (itensData || [])
        .filter(i => i.pedido_id === p.id)
        .map(i => ({
          titulo: prodMap.get(i.produto_id) as string || "Produto",
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
        })),
    }));

    setPedidos(enriched);
    setLoading(false);
  };

  useEffect(() => { if (lojaId) fetchPedidos(); }, [lojaId]);

  const handleStatus = async (pedidoId: string, newStatus: string) => {
    const { error } = await supabase
      .from("pedidos")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", pedidoId);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success(`Pedido ${STATUS_MAP[newStatus]?.label || newStatus}`);
    fetchPedidos();
  };

  return (
    <PrestadorLayout title="Pedidos" showBack>
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {!lojaId && !loading ? (
          <p className="text-body text-muted-foreground text-center py-8">
            Crie sua loja primeiro para receber pedidos.
          </p>
        ) : loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <ClipboardList size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhum pedido recebido</p>
          </div>
        ) : (
          pedidos.map(p => {
            const st = STATUS_MAP[p.status] || { label: p.status, color: "bg-muted text-muted-foreground" };
            const next = NEXT_STATUS[p.status];
            return (
              <Card key={p.id}>
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{p.morador_nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(p.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  {p.itens && p.itens.length > 0 && (
                    <div className="flex flex-col gap-1 bg-muted/30 rounded-lg p-2">
                      {p.itens.map((item, i) => (
                        <div key={i} className="flex justify-between text-[12px]">
                          <span className="text-foreground">{item.quantidade}x {item.titulo}</span>
                          <span className="text-muted-foreground">R$ {formatBRL(item.preco_unitario * item.quantidade)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {p.observacoes && (
                    <p className="text-[12px] text-muted-foreground italic">"{p.observacoes}"</p>
                  )}

                  <p className="text-[15px] font-bold text-primary">Total: R$ {formatBRL(p.valor_total)}</p>

                  {next && (
                    <div className="flex gap-2 mt-1">
                      <Button size="sm" className="flex-1" onClick={() => handleStatus(p.id, next)}>
                        Marcar como {STATUS_MAP[next]?.label}
                      </Button>
                      {p.status === "pendente" && (
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleStatus(p.id, "cancelado")}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorPedidos;

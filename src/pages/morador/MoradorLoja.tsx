import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatBRL } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, ShoppingCart, Plus, Minus, Clock, Phone, ArrowLeft } from "lucide-react";

interface Produto {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null;
}

interface CartItem {
  produto: Produto;
  quantidade: number;
}

const MoradorLoja = () => {
  const { lojaId } = useParams<{ lojaId: string }>();
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [loja, setLoja] = useState<any>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [obs, setObs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    if (!lojaId) return;
    (async () => {
      setLoading(true);
      const { data: lojaData } = await supabase
        .from("lojas")
        .select("*")
        .eq("id", lojaId)
        .eq("ativa", true)
        .maybeSingle();
      setLoja(lojaData);

      if (lojaData) {
        const { data: prods } = await supabase
          .from("produtos")
          .select("id, titulo, descricao, preco, imagem_url")
          .eq("prestador_id", lojaData.prestador_id)
          .eq("condominio_id", lojaData.condominio_id)
          .eq("status", "ativo")
          .gt("preco", 0)
          .not("imagem_url", "is", null)
          .not("descricao", "is", null)
          .order("created_at", { ascending: false });
        setProdutos((prods || []).filter(p => p.imagem_url?.trim() && p.descricao?.trim()));
      }
      setLoading(false);
    })();
  }, [lojaId]);

  const addToCart = (produto: Produto) => {
    setCart(prev => {
      const existing = prev.find(c => c.produto.id === produto.id);
      if (existing) {
        return prev.map(c => c.produto.id === produto.id ? { ...c, quantidade: c.quantidade + 1 } : c);
      }
      return [...prev, { produto, quantidade: 1 }];
    });
    toast.success("Adicionado ao carrinho");
  };

  const updateQty = (prodId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.produto.id !== prodId) return c;
      const newQty = c.quantidade + delta;
      return newQty > 0 ? { ...c, quantidade: newQty } : c;
    }).filter(c => c.quantidade > 0));
  };

  const removeFromCart = (prodId: string) => {
    setCart(prev => prev.filter(c => c.produto.id !== prodId));
  };

  const totalCart = cart.reduce((sum, c) => sum + (c.produto.preco || 0) * c.quantidade, 0);
  const totalItems = cart.reduce((sum, c) => sum + c.quantidade, 0);

  const handleSubmit = async () => {
    if (!user || !condominioId || !lojaId || cart.length === 0) return;
    setSubmitting(true);
    try {
      const { data: pedido, error: pedErr } = await supabase.from("pedidos").insert({
        loja_id: lojaId,
        condominio_id: condominioId,
        morador_id: user.id,
        valor_total: totalCart,
        observacoes: obs.trim() || null,
        status: "pendente",
      }).select("id").single();
      if (pedErr) throw pedErr;

      const itens = cart.map(c => ({
        pedido_id: pedido.id,
        produto_id: c.produto.id,
        quantidade: c.quantidade,
        preco_unitario: c.produto.preco || 0,
      }));
      const { error: itErr } = await supabase.from("pedido_itens").insert(itens);
      if (itErr) throw itErr;

      toast.success("Pedido enviado com sucesso!");
      setCart([]);
      setObs("");
      setShowCart(false);
      navigate("/morador/meus-pedidos");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MoradorLayout title="Loja" showBack>
        <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
      </MoradorLayout>
    );
  }

  if (!loja) {
    return (
      <MoradorLayout title="Loja" showBack>
        <p className="text-body text-muted-foreground text-center py-8">Loja não encontrada</p>
      </MoradorLayout>
    );
  }

  // Cart view
  if (showCart) {
    return (
      <MoradorLayout title="Carrinho" showBack>
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <Button variant="ghost" size="sm" className="self-start gap-1" onClick={() => setShowCart(false)}>
            <ArrowLeft size={16} /> Voltar à loja
          </Button>

          {cart.length === 0 ? (
            <p className="text-body text-muted-foreground text-center py-8">Carrinho vazio</p>
          ) : (
            <>
              {cart.map(c => (
                <Card key={c.produto.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    {c.produto.imagem_url && (
                      <img src={c.produto.imagem_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{c.produto.titulo}</p>
                      <p className="text-[12px] text-primary font-bold">R$ {formatBRL((c.produto.preco || 0) * c.quantidade)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(c.produto.id, -1)}>
                        <Minus size={14} />
                      </Button>
                      <span className="text-[13px] font-bold min-w-[20px] text-center">{c.quantidade}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(c.produto.id, 1)}>
                        <Plus size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Observações (opcional)</label>
                <Textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Alguma observação para o vendedor..." rows={2} />
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-[14px] font-semibold text-foreground">Total</span>
                <span className="text-[18px] font-extrabold text-primary">R$ {formatBRL(totalCart)}</span>
              </div>

              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? "Enviando..." : "Finalizar pedido"}
              </Button>
            </>
          )}
        </div>
      </MoradorLayout>
    );
  }

  return (
    <MoradorLayout title={loja.nome} showBack>
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Shop header */}
        {loja.banner_url && (
          <img src={loja.banner_url} alt={loja.nome} className="w-full h-36 object-cover rounded-2xl" />
        )}

        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-primary" />
            <h2 className="text-[16px] font-bold text-foreground">{loja.nome}</h2>
          </div>
          {loja.descricao && <p className="text-[13px] text-muted-foreground">{loja.descricao}</p>}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
            {loja.horario_funcionamento && (
              <span className="flex items-center gap-1"><Clock size={12} /> {loja.horario_funcionamento}</span>
            )}
            {loja.whatsapp && (
              <span className="flex items-center gap-1"><Phone size={12} /> {loja.whatsapp}</span>
            )}
          </div>
        </div>

        {/* Products grid */}
        {produtos.length === 0 ? (
          <p className="text-body text-muted-foreground text-center py-8">Nenhum produto disponível</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {produtos.map(p => (
              <div key={p.id} className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm">
                {p.imagem_url && (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={p.imagem_url} alt={p.titulo} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-3 flex flex-col gap-1">
                  <p className="text-[13px] font-semibold text-foreground truncate">{p.titulo}</p>
                  {p.preco != null && (
                    <p className="text-[16px] font-extrabold text-primary">R$ {formatBRL(p.preco)}</p>
                  )}
                  <Button size="sm" className="mt-1 gap-1 w-full" onClick={() => addToCart(p)}>
                    <Plus size={14} /> Adicionar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating cart button */}
        {cart.length > 0 && (
          <div className="fixed bottom-20 left-0 right-0 px-4 z-50 max-w-md mx-auto">
            <Button className="w-full gap-2 shadow-lg" onClick={() => setShowCart(true)}>
              <ShoppingCart size={18} />
              Ver carrinho ({totalItems}) • R$ {formatBRL(totalCart)}
            </Button>
          </div>
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorLoja;

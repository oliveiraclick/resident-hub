import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatBRL } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, ShoppingCart, Plus, Minus, Clock, Phone, ArrowLeft, UtensilsCrossed, Calendar } from "lucide-react";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Produto {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null;
}

interface CardapioItem {
  id: string;
  categoria_id: string | null;
  nome: string;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null;
  disponivel: boolean;
}

interface CardapioCategoria {
  id: string;
  nome: string;
  ordem: number;
}

interface Horario {
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string;
  ativo: boolean;
}

interface CartItem {
  id: string;
  nome: string;
  preco: number;
  imagem_url: string | null;
  quantidade: number;
  tipo: "produto" | "cardapio";
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

  // Cardápio state
  const [hasCardapio, setHasCardapio] = useState(false);
  const [activeTab, setActiveTab] = useState<"produtos" | "cardapio">("produtos");
  const [cardapioCats, setCardapioCats] = useState<CardapioCategoria[]>([]);
  const [cardapioItens, setCardapioItens] = useState<CardapioItem[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);

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
        // Products
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

        // Check cardápio
        const cardapioAtivo = (lojaData as any).cardapio_ativo;
        setHasCardapio(!!cardapioAtivo);

        if (cardapioAtivo) {
          const [catRes, itemRes, horRes] = await Promise.all([
            supabase.from("cardapio_categorias").select("*").eq("loja_id", lojaId).order("ordem"),
            supabase.from("cardapio_itens").select("*").eq("loja_id", lojaId).eq("disponivel", true).order("ordem"),
            supabase.from("cardapio_horarios").select("*").eq("loja_id", lojaId).eq("ativo", true).order("dia_semana"),
          ]);
          setCardapioCats((catRes.data || []) as CardapioCategoria[]);
          setCardapioItens((itemRes.data || []) as CardapioItem[]);
          setHorarios((horRes.data || []) as Horario[]);
          // Default to cardápio tab if it has items
          if ((itemRes.data || []).length > 0) setActiveTab("cardapio");
        }
      }
      setLoading(false);
    })();
  }, [lojaId]);

  const addToCart = (item: { id: string; nome: string; preco: number; imagem_url: string | null }, tipo: "produto" | "cardapio") => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id && c.tipo === tipo);
      if (existing) {
        return prev.map(c => c.id === item.id && c.tipo === tipo ? { ...c, quantidade: c.quantidade + 1 } : c);
      }
      return [...prev, { ...item, quantidade: 1, tipo }];
    });
    toast.success("Adicionado ao carrinho");
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newQty = c.quantidade + delta;
      return newQty > 0 ? { ...c, quantidade: newQty } : c;
    }).filter(c => c.quantidade > 0));
  };

  const totalCart = cart.reduce((sum, c) => sum + c.preco * c.quantidade, 0);
  const totalItems = cart.reduce((sum, c) => sum + c.quantidade, 0);

  const handleSubmit = async () => {
    if (!user || !condominioId || !lojaId || cart.length === 0) return;
    setSubmitting(true);
    try {
      // Build observações with cardápio items info
      const produtoItems = cart.filter(c => c.tipo === "produto");
      const cardapioItems = cart.filter(c => c.tipo === "cardapio");

      let obsText = obs.trim();
      if (cardapioItems.length > 0) {
        const cardapioSummary = cardapioItems.map(c => `${c.quantidade}x ${c.nome}`).join(", ");
        obsText = `[CARDÁPIO: ${cardapioSummary}]${obsText ? `\n${obsText}` : ""}`;
      }

      const { data: pedido, error: pedErr } = await supabase.from("pedidos").insert({
        loja_id: lojaId,
        condominio_id: condominioId,
        morador_id: user.id,
        valor_total: totalCart,
        observacoes: obsText || null,
        status: "pendente",
      }).select("id").single();
      if (pedErr) throw pedErr;

      // Insert produto items (cardápio items go as observações since they don't have produto_id)
      if (produtoItems.length > 0) {
        const itens = produtoItems.map(c => ({
          pedido_id: pedido.id,
          produto_id: c.id,
          quantidade: c.quantidade,
          preco_unitario: c.preco,
        }));
        const { error: itErr } = await supabase.from("pedido_itens").insert(itens);
        if (itErr) throw itErr;
      }

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
                <Card key={`${c.tipo}-${c.id}`}>
                  <CardContent className="flex items-center gap-3 p-3">
                    {c.imagem_url && (
                      <img src={c.imagem_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold text-foreground truncate">{c.nome}</p>
                        {c.tipo === "cardapio" && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">cardápio</Badge>
                        )}
                      </div>
                      <p className="text-[12px] text-primary font-bold">R$ {formatBRL(c.preco * c.quantidade)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(c.id, -1)}>
                        <Minus size={14} />
                      </Button>
                      <span className="text-[13px] font-bold min-w-[20px] text-center">{c.quantidade}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(c.id, 1)}>
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

        {/* Schedule (cardápio) */}
        {hasCardapio && horarios.length > 0 && (
          <div className="flex items-start gap-2 px-1 bg-muted/30 rounded-xl p-3">
            <Calendar size={14} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {horarios.map(h => (
                <span key={h.dia_semana} className="text-[11px] text-foreground">
                  <span className="font-medium">{DIAS_SEMANA[h.dia_semana].slice(0, 3)}</span>{" "}
                  <span className="text-muted-foreground">{h.horario_inicio.slice(0, 5)}-{h.horario_fim.slice(0, 5)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        {hasCardapio && cardapioItens.length > 0 && produtos.length > 0 && (
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("cardapio")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === "cardapio" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              <UtensilsCrossed size={14} /> Cardápio
            </button>
            <button
              onClick={() => setActiveTab("produtos")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === "produtos" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              <Store size={14} /> Produtos
            </button>
          </div>
        )}

        {/* Cardápio view */}
        {(activeTab === "cardapio" && hasCardapio && cardapioItens.length > 0) ? (
          <div className="flex flex-col gap-4">
            {cardapioCats.length > 0 ? cardapioCats.map(cat => {
              const items = cardapioItens.filter(i => i.categoria_id === cat.id);
              if (items.length === 0) return null;
              return (
                <div key={cat.id}>
                  <p className="text-[13px] font-bold text-foreground uppercase tracking-wider mb-2 px-1">{cat.nome}</p>
                  {items.map(item => (
                    <CardapioItemCard key={item.id} item={item} onAdd={() => addToCart({
                      id: item.id, nome: item.nome, preco: item.preco || 0, imagem_url: item.imagem_url,
                    }, "cardapio")} />
                  ))}
                </div>
              );
            }) : null}

            {/* Items without category */}
            {cardapioItens.filter(i => !i.categoria_id || !cardapioCats.find(c => c.id === i.categoria_id)).map(item => (
              <CardapioItemCard key={item.id} item={item} onAdd={() => addToCart({
                id: item.id, nome: item.nome, preco: item.preco || 0, imagem_url: item.imagem_url,
              }, "cardapio")} />
            ))}
          </div>
        ) : (
          /* Products grid */
          produtos.length === 0 ? (
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
                    <Button size="sm" className="mt-1 gap-1 w-full" onClick={() => addToCart({
                      id: p.id, nome: p.titulo, preco: p.preco || 0, imagem_url: p.imagem_url,
                    }, "produto")}>
                      <Plus size={14} /> Adicionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
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

const CardapioItemCard = ({ item, onAdd }: { item: CardapioItem; onAdd: () => void }) => (
  <div className="flex items-center gap-3 p-3 border-b border-border last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-[14px] font-semibold text-foreground">{item.nome}</p>
      {item.descricao && <p className="text-[12px] text-muted-foreground line-clamp-2">{item.descricao}</p>}
      {item.preco != null && (
        <p className="text-[15px] font-bold text-primary mt-0.5">R$ {item.preco.toFixed(2)}</p>
      )}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {item.imagem_url && (
        <img src={item.imagem_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
      )}
      <Button size="icon" className="h-8 w-8 rounded-full" onClick={onAdd}>
        <Plus size={16} />
      </Button>
    </div>
  </div>
);

export default MoradorLoja;

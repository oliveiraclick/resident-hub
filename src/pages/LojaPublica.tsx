import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoSymbol from "@/assets/logo-symbol.png";
import {
  Store, ShoppingBag, Clock, MessageCircle, ArrowLeft, Phone,
} from "lucide-react";

interface Loja {
  id: string;
  nome: string;
  descricao: string | null;
  banner_url: string | null;
  horario_funcionamento: string | null;
  whatsapp: string | null;
  cardapio_ativo: boolean;
}

interface Produto {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null;
}

interface CardapioCategoria {
  id: string;
  nome: string;
  ordem: number;
}

interface CardapioItem {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null;
  categoria_id: string | null;
}

const LojaPublica = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<CardapioCategoria[]>([]);
  const [cardapioItens, setCardapioItens] = useState<CardapioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"produtos" | "cardapio">("produtos");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);

      // Fetch loja by slug
      const { data: lojaData, error } = await supabase
        .from("lojas")
        .select("id, nome, descricao, banner_url, horario_funcionamento, whatsapp, cardapio_ativo")
        .eq("slug", slug)
        .eq("ativa", true)
        .maybeSingle();

      if (error || !lojaData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoja(lojaData);

      // Fetch produtos
      const { data: prodData } = await supabase
        .from("produtos")
        .select("id, titulo, descricao, preco, imagem_url")
        .eq("prestador_id", (await supabase.from("lojas").select("prestador_id").eq("id", lojaData.id).single()).data?.prestador_id || "")
        .eq("status", "ativo")
        .order("created_at", { ascending: false });

      setProdutos(prodData || []);

      // Fetch cardapio if active
      if (lojaData.cardapio_ativo) {
        const [catRes, itemRes] = await Promise.all([
          supabase
            .from("cardapio_categorias")
            .select("id, nome, ordem")
            .eq("loja_id", lojaData.id)
            .order("ordem"),
          supabase
            .from("cardapio_itens")
            .select("id, nome, descricao, preco, imagem_url, categoria_id")
            .eq("loja_id", lojaData.id)
            .eq("disponivel", true)
            .order("ordem"),
        ]);
        setCategorias(catRes.data || []);
        setCardapioItens(itemRes.data || []);
      }

      setLoading(false);
    })();
  }, [slug]);

  const sendWhatsApp = (produtoNome?: string) => {
    if (!loja?.whatsapp) return;
    const phone = loja.whatsapp.replace(/\D/g, "");
    const msg = produtoNome
      ? `Olá! Vi o produto "${produtoNome}" na loja ${loja.nome} e gostaria de mais informações.`
      : `Olá! Vi sua loja ${loja.nome} no Morador.app e gostaria de mais informações.`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background gap-4 px-6">
        <img src={logoSymbol} alt="Morador.app" className="h-16" />
        <h1 className="text-xl font-bold text-foreground">Loja não encontrada</h1>
        <p className="text-muted-foreground text-center text-sm">
          O link que você acessou não corresponde a nenhuma loja ativa.
        </p>
        <Button variant="outline" onClick={() => navigate("/")} className="gap-1.5">
          <ArrowLeft size={16} /> Ir para o início
        </Button>
      </div>
    );
  }

  if (!loja) return null;

  const hasProdutos = produtos.length > 0;
  const hasCardapio = loja.cardapio_ativo && cardapioItens.length > 0;
  const showTabs = hasProdutos && hasCardapio;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <img src={logoSymbol} alt="Morador.app" className="h-8" />
        <span className="font-bold text-foreground text-sm flex-1 truncate">{loja.nome}</span>
        {loja.whatsapp && (
          <Button size="sm" onClick={() => sendWhatsApp()} className="gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white">
            <MessageCircle size={16} /> Contato
          </Button>
        )}
      </header>

      {/* Banner */}
      {loja.banner_url && (
        <img src={loja.banner_url} alt={loja.nome} className="w-full h-44 object-cover" />
      )}

      {/* Info */}
      <div className="px-4 py-4 space-y-2">
        <div className="flex items-center gap-2">
          <Store size={20} className="text-primary" />
          <h1 className="text-lg font-bold text-foreground">{loja.nome}</h1>
        </div>
        {loja.descricao && (
          <p className="text-sm text-muted-foreground">{loja.descricao}</p>
        )}
        {loja.horario_funcionamento && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={14} />
            <span>{loja.horario_funcionamento}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      {showTabs && (
        <div className="flex border-b border-border px-4">
          <button
            className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === "produtos"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
            onClick={() => setActiveTab("produtos")}
          >
            Produtos
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === "cardapio"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
            onClick={() => setActiveTab("cardapio")}
          >
            Cardápio
          </button>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4">
        {/* Produtos */}
        {(activeTab === "produtos" || !showTabs) && hasProdutos && (
          <div className="grid grid-cols-2 gap-3">
            {produtos.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                {p.imagem_url && (
                  <img src={p.imagem_url} alt={p.titulo} className="w-full aspect-[4/3] object-cover" />
                )}
                <CardContent className="p-3 space-y-1">
                  <p className="text-[13px] font-semibold text-foreground line-clamp-2">{p.titulo}</p>
                  {p.preco != null && (
                    <p className="text-[14px] font-bold text-primary">R$ {formatBRL(p.preco)}</p>
                  )}
                  {loja.whatsapp && (
                    <Button
                      size="sm"
                      className="w-full mt-1 gap-1 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[12px] h-8"
                      onClick={() => sendWhatsApp(p.titulo)}
                    >
                      <Phone size={12} /> Comprar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Cardápio */}
        {(activeTab === "cardapio" || (!showTabs && hasCardapio && !hasProdutos)) && hasCardapio && (
          <div className="space-y-6">
            {categorias.map((cat) => {
              const items = cardapioItens.filter((i) => i.categoria_id === cat.id);
              if (items.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-3">
                  <h3 className="text-[15px] font-bold text-foreground">{cat.nome}</h3>
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start">
                      {item.imagem_url && (
                        <img src={item.imagem_url} alt={item.nome} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground">{item.nome}</p>
                        {item.descricao && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{item.descricao}</p>
                        )}
                        {item.preco != null && (
                          <p className="text-[13px] font-bold text-primary mt-0.5">R$ {formatBRL(item.preco)}</p>
                        )}
                      </div>
                      {loja.whatsapp && (
                        <Button
                          size="sm"
                          className="bg-[#25D366] hover:bg-[#20bd5a] text-white h-8 px-2 flex-shrink-0"
                          onClick={() => sendWhatsApp(item.nome)}
                        >
                          <Phone size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            {/* Items without category */}
            {(() => {
              const uncategorized = cardapioItens.filter((i) => !i.categoria_id);
              if (uncategorized.length === 0) return null;
              return (
                <div className="space-y-3">
                  <h3 className="text-[15px] font-bold text-foreground">Outros</h3>
                  {uncategorized.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start">
                      {item.imagem_url && (
                        <img src={item.imagem_url} alt={item.nome} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground">{item.nome}</p>
                        {item.preco != null && (
                          <p className="text-[13px] font-bold text-primary mt-0.5">R$ {formatBRL(item.preco)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Empty state */}
        {!hasProdutos && !hasCardapio && (
          <div className="flex flex-col items-center gap-3 py-12">
            <ShoppingBag size={40} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum produto disponível no momento</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <img src={logoSymbol} alt="" className="h-6" />
          <span className="text-sm font-semibold text-muted-foreground">Morador.app</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Crie sua loja grátis em{" "}
          <a href="/" className="text-primary font-medium hover:underline">morador.app</a>
        </p>
      </footer>
    </div>
  );
};

export default LojaPublica;

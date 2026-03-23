import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoSymbol from "@/assets/logo-symbol.png";
import {
  Store, ShoppingBag, Clock, MessageCircle, ArrowLeft, Phone,
  ChevronRight, X, Search, Share2, ExternalLink, Heart,
} from "lucide-react";

interface Loja {
  id: string;
  nome: string;
  descricao: string | null;
  banner_url: string | null;
  horario_funcionamento: string | null;
  whatsapp: string | null;
  cardapio_ativo: boolean;
  prestador_id: string;
}

interface PrestadorProfile {
  avatar_url: string | null;
  nome: string;
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
  const [prestadorProfile, setPrestadorProfile] = useState<PrestadorProfile | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<CardapioCategoria[]>([]);
  const [cardapioItens, setCardapioItens] = useState<CardapioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"produtos" | "cardapio">("produtos");
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: lojaData, error } = await supabase
        .from("lojas")
        .select("id, nome, descricao, banner_url, horario_funcionamento, whatsapp, cardapio_ativo, prestador_id")
        .eq("slug", slug)
        .eq("ativa", true)
        .maybeSingle();

      if (error || !lojaData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoja(lojaData);

      const { data: prestadorData } = await supabase
        .from("prestadores")
        .select("user_id")
        .eq("id", lojaData.prestador_id)
        .single();

      if (prestadorData) {
        const { data: profileData } = await supabase
          .rpc("get_prestador_profiles", { _user_ids: [prestadorData.user_id] });
        if (profileData && profileData.length > 0) {
          setPrestadorProfile({
            avatar_url: profileData[0].avatar_url,
            nome: profileData[0].nome,
          });
        }
      }

      const { data: prodData } = await supabase
        .from("produtos")
        .select("id, titulo, descricao, preco, imagem_url")
        .eq("prestador_id", lojaData.prestador_id)
        .eq("status", "ativo")
        .order("created_at", { ascending: false });
      setProdutos(prodData || []);

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

  const shareStore = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: loja?.nome, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const filteredProdutos = searchQuery
    ? produtos.filter(p => p.titulo.toLowerCase().includes(searchQuery.toLowerCase()))
    : produtos;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-muted animate-spin border-t-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground tracking-wide">Carregando...</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-white gap-6 px-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Store size={36} className="text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground">Loja não encontrada</h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            O link que você acessou não corresponde a nenhuma loja ativa.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")} className="gap-2 rounded-full px-6">
          <ArrowLeft size={16} /> Voltar ao início
        </Button>
      </div>
    );
  }

  if (!loja) return null;

  const hasProdutos = filteredProdutos.length > 0;
  const hasCardapio = loja.cardapio_ativo && cardapioItens.length > 0;
  const showTabs = produtos.length > 0 && hasCardapio;
  const isDemo = slug === "moto-acessorios";

  return (
    <div className="min-h-screen bg-white">
      {/* Demo banner */}
      {isDemo && (
        <div className="bg-foreground text-primary-foreground text-center text-[11px] font-semibold py-2 tracking-[0.15em] uppercase">
          ✨ Loja Modelo — Exemplo demonstrativo
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            {prestadorProfile?.avatar_url ? (
              <img
                src={prestadorProfile.avatar_url}
                alt={loja.nome}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <Store size={16} className="text-primary-foreground" />
              </div>
            )}
            <span className="font-bold text-foreground text-[15px] truncate max-w-[160px]">{loja.nome}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2.5 rounded-full hover:bg-muted transition-colors"
            >
              <Search size={18} className="text-muted-foreground" />
            </button>
            <button
              onClick={shareStore}
              className="p-2.5 rounded-full hover:bg-muted transition-colors"
            >
              <Share2 size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>
        {/* Search bar expandable */}
        {showSearch && (
          <div className="px-4 pb-3 max-w-2xl mx-auto">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-muted rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                autoFocus
              />
            </div>
          </div>
        )}
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Hero */}
        <div className="relative">
          {loja.banner_url ? (
            <div className="relative aspect-[21/9] sm:aspect-[3/1] overflow-hidden">
              <img src={loja.banner_url} alt={loja.nome} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
            </div>
          ) : (
            <div className="aspect-[21/9] sm:aspect-[3/1] bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 flex items-center justify-center">
              <Store size={48} className="text-primary-foreground/30" />
            </div>
          )}
        </div>

        {/* Store Info Card */}
        <div className="px-4 -mt-8 relative z-10">
          <div className="bg-card rounded-2xl border border-border shadow-xl p-5">
            <div className="flex items-start gap-4">
              {/* Avatar grande */}
              <div className="flex-shrink-0 -mt-12">
                {prestadorProfile?.avatar_url ? (
                  <img
                    src={prestadorProfile.avatar_url}
                    alt={loja.nome}
                    className="w-[72px] h-[72px] rounded-2xl object-cover border-[3px] border-card shadow-lg"
                  />
                ) : (
                  <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-primary to-primary/80 border-[3px] border-card shadow-lg flex items-center justify-center">
                    <Store size={28} className="text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h1 className="text-[17px] font-extrabold text-foreground tracking-tight">{loja.nome}</h1>
                {loja.descricao && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{loja.descricao}</p>
                )}
              </div>
            </div>

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {loja.horario_funcionamento && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  <Clock size={12} />
                  {loja.horario_funcionamento}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                <ShoppingBag size={12} />
                {produtos.length} {produtos.length === 1 ? "produto" : "produtos"}
              </span>
            </div>

            {/* WhatsApp CTA */}
            {loja.whatsapp && (
              <button
                onClick={() => sendWhatsApp()}
                className="w-full mt-4 flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1fba59] active:scale-[0.98] text-white h-12 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-[#25D366]/25"
              >
                <MessageCircle size={18} /> Falar com a loja
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {showTabs && (
          <div className="px-4 mt-6">
            <div className="flex border-b border-border">
              <button
                className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${
                  activeTab === "produtos"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("produtos")}
              >
                Produtos
                {activeTab === "produtos" && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-[2.5px] bg-primary rounded-full" />
                )}
              </button>
              <button
                className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${
                  activeTab === "cardapio"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("cardapio")}
              >
                Cardápio
                {activeTab === "cardapio" && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-[2.5px] bg-primary rounded-full" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Section title */}
        <div className="px-4 mt-6 mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            {activeTab === "produtos" ? "Todos os produtos" : "Cardápio"}
          </h2>
          {activeTab === "produtos" && (
            <span className="text-xs font-medium text-muted-foreground">
              {filteredProdutos.length} {filteredProdutos.length === 1 ? "item" : "itens"}
            </span>
          )}
        </div>

        {/* Products Grid */}
        <div className="px-4 pb-8">
          {(activeTab === "produtos" || !showTabs) && hasProdutos && (
            <div className="grid grid-cols-2 gap-3">
              {filteredProdutos.map((p) => (
                <div
                  key={p.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => setSelectedProduto(p)}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {p.imagem_url ? (
                      <img
                        src={p.imagem_url}
                        alt={p.titulo}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={32} className="text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Quick action overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-foreground text-[11px] font-semibold px-4 py-2 rounded-full shadow-lg">
                        Ver detalhes
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug">{p.titulo}</p>
                    {p.preco != null && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] text-muted-foreground font-medium">R$</span>
                        <span className="text-[17px] font-extrabold text-foreground tracking-tight">
                          {formatBRL(p.preco)}
                        </span>
                      </div>
                    )}
                    {loja.whatsapp && (
                      <button
                        className="w-full mt-2 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-[11px] font-bold h-9 rounded-lg transition-colors active:scale-[0.97] shadow-md shadow-primary/25"
                        onClick={(e) => { e.stopPropagation(); sendWhatsApp(p.titulo); }}
                      >
                        <Phone size={12} /> Comprar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search no results */}
          {activeTab === "produtos" && searchQuery && !hasProdutos && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Search size={32} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum produto encontrado para "{searchQuery}"</p>
            </div>
          )}

          {/* Cardápio */}
          {(activeTab === "cardapio" || (!showTabs && hasCardapio && produtos.length === 0)) && hasCardapio && (
            <div className="space-y-6">
              {categorias.map((cat) => {
                const items = cardapioItens.filter((i) => i.categoria_id === cat.id);
                if (items.length === 0) return null;
                return (
                  <div key={cat.id} className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] px-1">{cat.nome}</h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="bg-card rounded-xl border border-border p-3 flex gap-3 items-start hover:border-primary/30 transition-colors">
                          {item.imagem_url && (
                            <img src={item.imagem_url} alt={item.nome} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground">{item.nome}</p>
                            {item.descricao && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{item.descricao}</p>
                            )}
                            {item.preco != null && (
                              <p className="text-[14px] font-bold text-foreground mt-1.5">R$ {formatBRL(item.preco)}</p>
                            )}
                          </div>
                          {loja.whatsapp && (
                            <button
                              className="bg-primary text-primary-foreground h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-primary-hover transition-colors shadow-md shadow-primary/25"
                              onClick={() => sendWhatsApp(item.nome)}
                            >
                              <Phone size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(() => {
                const uncategorized = cardapioItens.filter((i) => !i.categoria_id);
                if (uncategorized.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] px-1">Outros</h3>
                    {uncategorized.map((item) => (
                      <div key={item.id} className="bg-card rounded-xl border border-border p-3 flex gap-3 items-start">
                        {item.imagem_url && (
                          <img src={item.imagem_url} alt={item.nome} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground">{item.nome}</p>
                          {item.preco != null && (
                            <p className="text-[14px] font-bold text-foreground mt-1">R$ {formatBRL(item.preco)}</p>
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
          {produtos.length === 0 && !hasCardapio && (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag size={32} className="text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum produto disponível no momento</p>
            </div>
          )}
        </div>

        {/* Banner Morador.app */}
        <div className="px-4 pb-6">
          <div
            className="bg-foreground rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => navigate("/")}
          >
            <img src={logoSymbol} alt="Morador.app" className="h-11 flex-shrink-0 drop-shadow-lg" />
            <div className="flex-1">
              <p className="text-sm font-bold text-primary-foreground">Crie sua loja grátis</p>
              <p className="text-[11px] text-primary-foreground/60 mt-0.5 leading-relaxed">
                Monte sua vitrine online e venda para todo o condomínio.
              </p>
            </div>
            <ExternalLink size={18} className="text-primary-foreground/40 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <img src={logoSymbol} alt="" className="h-7 opacity-60" />
            <span className="text-sm font-bold text-muted-foreground">Morador.app</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 tracking-wide uppercase">
            Plataforma de serviços e comércio para condomínios
          </p>
        </div>
      </footer>

      {/* Product Detail Modal — Fullscreen Bottom Sheet */}
      {selectedProduto && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200"
          onClick={() => setSelectedProduto(null)}
        >
          <div
            className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedProduto(null)}
              className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-colors"
            >
              <X size={18} />
            </button>

            {selectedProduto.imagem_url ? (
              <img
                src={selectedProduto.imagem_url}
                alt={selectedProduto.titulo}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center">
                <ShoppingBag size={48} className="text-muted-foreground/30" />
              </div>
            )}

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-foreground tracking-tight leading-tight">
                  {selectedProduto.titulo}
                </h2>
                {selectedProduto.descricao && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{selectedProduto.descricao}</p>
                )}
              </div>

              {selectedProduto.preco != null && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-muted-foreground font-medium">R$</span>
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">
                    {formatBRL(selectedProduto.preco)}
                  </span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                {loja.whatsapp && (
                  <Button
                    onClick={() => sendWhatsApp(selectedProduto.titulo)}
                    className="flex-1 gap-2.5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-primary-foreground h-13 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all"
                  >
                    <Phone size={16} /> Comprar via WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LojaPublica;

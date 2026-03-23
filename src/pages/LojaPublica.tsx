import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoSymbol from "@/assets/logo-symbol.png";
import {
  Store, ShoppingBag, Clock, MessageCircle, ArrowLeft, Phone,
  MapPin, ChevronRight, Star,
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

      // Fetch prestador profile (avatar)
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

      // Fetch produtos
      const { data: prodData } = await supabase
        .from("produtos")
        .select("id, titulo, descricao, preco, imagem_url")
        .eq("prestador_id", lojaData.prestador_id)
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
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-sm text-[#6b7280]">Carregando loja...</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#f8f9fa] gap-5 px-6">
        <img src={logoSymbol} alt="Morador.app" className="h-20" />
        <h1 className="text-xl font-bold text-[#1f2937]">Loja não encontrada</h1>
        <p className="text-[#6b7280] text-center text-sm max-w-xs">
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
  const isDemo = slug === "moto-acessorios";

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Demo banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-primary to-[hsl(var(--primary)/0.8)] text-white text-center text-xs font-semibold py-2 tracking-wide uppercase">
          ✨ Loja Modelo — Exemplo demonstrativo
        </div>
      )}

      {/* Hero Section with Banner */}
      <div className="relative">
        {loja.banner_url ? (
          <div className="relative h-52 sm:h-64 overflow-hidden">
            <img src={loja.banner_url} alt={loja.nome} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-primary via-primary/80 to-primary/60" />
        )}

        {/* Store info overlay */}
        <div className="relative -mt-16 px-4 pb-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 flex items-start gap-4">
            {/* Logo do prestador */}
            <div className="flex-shrink-0 -mt-10">
              {prestadorProfile?.avatar_url ? (
                <img
                  src={prestadorProfile.avatar_url}
                  alt={loja.nome}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 border-4 border-white shadow-md flex items-center justify-center">
                  <Store size={32} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-lg font-bold text-[#1f2937] truncate">{loja.nome}</h1>
              {loja.descricao && (
                <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-2">{loja.descricao}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {loja.horario_funcionamento && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-full">
                    <Clock size={11} />
                    {loja.horario_funcionamento}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp CTA */}
      {loja.whatsapp && (
        <div className="px-4 -mt-1 mb-4">
          <Button
            onClick={() => sendWhatsApp()}
            className="w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white h-12 rounded-xl shadow-md text-sm font-semibold"
          >
            <MessageCircle size={18} /> Falar com a loja via WhatsApp
          </Button>
        </div>
      )}

      {/* Tabs */}
      {showTabs && (
        <div className="px-4 mb-3">
          <div className="flex bg-white rounded-xl p-1 shadow-sm">
            <button
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "produtos"
                  ? "bg-primary text-white shadow-sm"
                  : "text-[#6b7280] hover:text-[#1f2937]"
              }`}
              onClick={() => setActiveTab("produtos")}
            >
              Produtos
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "cardapio"
                  ? "bg-primary text-white shadow-sm"
                  : "text-[#6b7280] hover:text-[#1f2937]"
              }`}
              onClick={() => setActiveTab("cardapio")}
            >
              Cardápio
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-6">
        {/* Produtos */}
        {(activeTab === "produtos" || !showTabs) && hasProdutos && (
          <div className="grid grid-cols-2 gap-3">
            {produtos.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setSelectedProduto(p)}
              >
                {p.imagem_url ? (
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={p.imagem_url}
                      alt={p.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-[#f3f4f6] flex items-center justify-center">
                    <ShoppingBag size={32} className="text-[#d1d5db]" />
                  </div>
                )}
                <div className="p-3 space-y-1.5">
                  <p className="text-[13px] font-semibold text-[#1f2937] line-clamp-2 leading-tight">{p.titulo}</p>
                  {p.preco != null && (
                    <p className="text-[15px] font-bold text-primary">R$ {formatBRL(p.preco)}</p>
                  )}
                  {loja.whatsapp && (
                    <button
                      className="w-full mt-1 flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[12px] font-semibold h-9 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); sendWhatsApp(p.titulo); }}
                    >
                      <Phone size={13} /> Comprar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cardápio */}
        {(activeTab === "cardapio" || (!showTabs && hasCardapio && !hasProdutos)) && hasCardapio && (
          <div className="space-y-5">
            {categorias.map((cat) => {
              const items = cardapioItens.filter((i) => i.categoria_id === cat.id);
              if (items.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-2">
                  <h3 className="text-sm font-bold text-[#1f2937] uppercase tracking-wide px-1">{cat.nome}</h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="bg-white rounded-xl p-3 flex gap-3 items-start shadow-sm">
                        {item.imagem_url && (
                          <img src={item.imagem_url} alt={item.nome} className="w-18 h-18 rounded-xl object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#1f2937]">{item.nome}</p>
                          {item.descricao && (
                            <p className="text-[11px] text-[#6b7280] line-clamp-2 mt-0.5">{item.descricao}</p>
                          )}
                          {item.preco != null && (
                            <p className="text-[14px] font-bold text-primary mt-1">R$ {formatBRL(item.preco)}</p>
                          )}
                        </div>
                        {loja.whatsapp && (
                          <button
                            className="bg-[#25D366] hover:bg-[#20bd5a] text-white h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                            onClick={() => sendWhatsApp(item.nome)}
                          >
                            <Phone size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Items without category */}
            {(() => {
              const uncategorized = cardapioItens.filter((i) => !i.categoria_id);
              if (uncategorized.length === 0) return null;
              return (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#1f2937] uppercase tracking-wide px-1">Outros</h3>
                  {uncategorized.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-3 flex gap-3 items-start shadow-sm">
                      {item.imagem_url && (
                        <img src={item.imagem_url} alt={item.nome} className="w-18 h-18 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1f2937]">{item.nome}</p>
                        {item.preco != null && (
                          <p className="text-[14px] font-bold text-primary mt-1">R$ {formatBRL(item.preco)}</p>
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
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-16 h-16 rounded-full bg-[#f3f4f6] flex items-center justify-center">
              <ShoppingBag size={28} className="text-[#d1d5db]" />
            </div>
            <p className="text-sm text-[#6b7280]">Nenhum produto disponível no momento</p>
          </div>
        )}
      </div>

      {/* Product detail modal */}
      {selectedProduto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setSelectedProduto(null)}>
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedProduto.imagem_url && (
              <img src={selectedProduto.imagem_url} alt={selectedProduto.titulo} className="w-full aspect-square object-cover rounded-t-3xl sm:rounded-t-3xl" />
            )}
            <div className="p-5 space-y-3">
              <h2 className="text-lg font-bold text-[#1f2937]">{selectedProduto.titulo}</h2>
              {selectedProduto.descricao && (
                <p className="text-sm text-[#6b7280]">{selectedProduto.descricao}</p>
              )}
              {selectedProduto.preco != null && (
                <p className="text-xl font-bold text-primary">R$ {formatBRL(selectedProduto.preco)}</p>
              )}
              <div className="flex gap-2 pt-2">
                {loja.whatsapp && (
                  <Button
                    onClick={() => sendWhatsApp(selectedProduto.titulo)}
                    className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white h-12 rounded-xl font-semibold"
                  >
                    <Phone size={16} /> Comprar via WhatsApp
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedProduto(null)}
                  className="h-12 rounded-xl px-5"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner de propaganda do app */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
          <img src={logoSymbol} alt="Morador.app" className="h-12 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-[#1f2937]">Crie sua loja grátis</p>
            <p className="text-[11px] text-[#6b7280] mt-0.5">
              Tenha sua vitrine online no Morador.app e venda para todo o condomínio.
            </p>
          </div>
          <ChevronRight size={18} className="text-primary flex-shrink-0" />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e5e7eb] px-4 py-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <img src={logoSymbol} alt="" className="h-8" />
          <span className="text-sm font-bold text-[#1f2937]">Morador.app</span>
        </div>
        <p className="text-[11px] text-[#9ca3af]">
          Plataforma de serviços e comércio para condomínios
        </p>
      </footer>
    </div>
  );
};

export default LojaPublica;

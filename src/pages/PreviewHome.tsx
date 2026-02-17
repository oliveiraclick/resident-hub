import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, ShoppingBag, ChevronLeft, ChevronRight, Repeat, MapPin,
  Wrench, Home, Search, Bell, User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCategorias } from "@/hooks/useCategorias";
import { getIcon } from "@/lib/iconMap";

import productBolo from "@/assets/product-bolo.jpg";
import productSabonete from "@/assets/product-sabonete.jpg";
import productBrigadeiro from "@/assets/product-brigadeiro.jpg";
import productVela from "@/assets/product-vela.jpg";
import desapegoBike from "@/assets/desapego-bike.jpg";
import desapegoSofa from "@/assets/desapego-sofa.jpg";
import desapegoLivros from "@/assets/desapego-livros.jpg";
import desapegoCarrinho from "@/assets/desapego-carrinho.jpg";

const fallbackShopImages = [productBolo, productSabonete, productBrigadeiro, productVela];
const fallbackDesapegoImages = [desapegoBike, desapegoSofa, desapegoLivros, desapegoCarrinho];

const blue = {
  bg: "#F0F4FA",
  primary: "#1E3A8A",
  primaryLight: "#3B82F6",
  primaryBg: "#EFF6FF",
  primaryBorder: "#BFDBFE",
  dark: "#0F172A",
  card: "#FFFFFF",
  muted: "#64748B",
  border: "#E2E8F0",
  white: "#FFFFFF",
};

const PreviewHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categorias: allCategorias } = useCategorias();

  const [pendingCount, setPendingCount] = useState(0);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [desapegos, setDesapegos] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<any[]>([]);
  const [prestadoresVisiveis, setPrestadoresVisiveis] = useState<any[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  const shopRef = useRef<HTMLDivElement>(null);
  const desapegoRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    const fetchPending = async () => {
      const { count } = await supabase
        .from("pacotes")
        .select("id", { count: "exact", head: true })
        .eq("morador_id", user.id)
        .in("status", ["RECEBIDO", "AGUARDANDO_RETIRADA", "TRIADO"]);
      setPendingCount(count || 0);
    };

    const fetchProdutos = async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, titulo, preco, status")
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(8);
      setProdutos(data || []);
    };

    const fetchDesapegos = async () => {
      const { data } = await supabase
        .from("desapegos")
        .select("id, titulo, preco, status")
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(8);
      setDesapegos(data || []);
    };

    const fetchBanners = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      setBanners(data || []);
    };

    const fetchAvisos = async () => {
      const { data } = await supabase
        .from("avisos")
        .select("id, texto")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      setAvisos(data || []);
    };

    const fetchPrestadoresVisiveis = async () => {
      const { data } = await supabase
        .from("prestadores")
        .select("id, user_id, especialidade, visivel_ate")
        .eq("visivel", true)
        .gt("visivel_ate", new Date().toISOString());
      if (data && data.length > 0) {
        const userIds = data.map((p: any) => p.user_id);
        const { data: profiles } = await supabase.rpc("get_prestador_profiles", { _user_ids: userIds });
        const merged = data.map((p: any) => {
          const profile = (profiles || []).find((pr: any) => pr.user_id === p.user_id);
          return { ...p, nome: profile?.nome || "Prestador", avatar_url: profile?.avatar_url };
        });
        setPrestadoresVisiveis(merged);
      } else {
        setPrestadoresVisiveis([]);
      }
    };

    fetchPending();
    fetchProdutos();
    fetchDesapegos();
    fetchBanners();
    fetchAvisos();
    fetchPrestadoresVisiveis();
  }, [user]);

  const shopItems = produtos.length > 0 ? produtos : [
    { id: "mock-1", titulo: "Bolo Caseiro", preco: 25, status: "ativo" },
    { id: "mock-2", titulo: "Sabonete Artesanal", preco: 12, status: "ativo" },
    { id: "mock-3", titulo: "Brigadeiro Gourmet", preco: 3.5, status: "ativo" },
    { id: "mock-4", titulo: "Vela Aromática", preco: 18, status: "ativo" },
  ];

  const desapegoItems = desapegos.length > 0 ? desapegos : [
    { id: "mock-1", titulo: "Bicicleta Aro 29", preco: 450, status: "ativo" },
    { id: "mock-2", titulo: "Sofá 3 Lugares", preco: 800, status: "ativo" },
    { id: "mock-3", titulo: "Livros Diversos", preco: 5, status: "ativo" },
    { id: "mock-4", titulo: "Carrinho de Bebê", preco: 350, status: "ativo" },
  ];

  return (
    <div style={{ background: blue.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      {/* Header escuro */}
      <div style={{
        background: `linear-gradient(135deg, ${blue.dark} 0%, ${blue.primary} 100%)`,
        borderRadius: "0 0 24px 24px",
        padding: "48px 20px 24px",
        color: blue.white,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 2 }}>Bem-vindo de volta 👋</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Morador.app</h1>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Bell size={20} color={blue.white} />
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.12)",
          borderRadius: 16, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Search size={16} color="rgba(255,255,255,0.6)" />
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Buscar serviços, produtos...</span>
        </div>
      </div>

      <div style={{ padding: "20px 16px 100px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Serviços - categorias do banco */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: blue.dark, margin: 0 }}>Serviços</h2>
            <button onClick={() => navigate("/morador/servicos/categorias")} style={{ fontSize: 11, fontWeight: 600, color: blue.primary, textTransform: "uppercase", letterSpacing: 0.5, background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {allCategorias.slice(0, 4).map((cat) => {
              const Icon = getIcon(cat.icone);
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(cat.nome)}`)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: blue.primaryBg, border: `1px solid ${blue.primaryBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={22} color={blue.primary} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: blue.dark, textAlign: "center" }}>{cat.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prestadores no condomínio */}
        {prestadoresVisiveis.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <MapPin size={16} color={blue.primary} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: blue.dark, margin: 0 }}>No condomínio agora</h2>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
              {prestadoresVisiveis.map((p) => {
                const mins = Math.max(0, Math.ceil((new Date(p.visivel_ate).getTime() - Date.now()) / 60000));
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(p.especialidade)}`)}
                    style={{
                      flexShrink: 0, display: "flex", alignItems: "center", gap: 12,
                      borderRadius: 16, background: blue.primaryBg, border: `1px solid ${blue.primaryBorder}`,
                      padding: "12px 16px", cursor: "pointer",
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: blue.primary, display: "flex", alignItems: "center", justifyContent: "center",
                      color: blue.white, fontWeight: 700, fontSize: 14,
                    }}>
                      {p.nome?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: blue.dark, margin: 0 }}>{p.nome}</p>
                      <p style={{ fontSize: 11, fontWeight: 500, color: blue.primary, margin: 0 }}>{p.especialidade}</p>
                      <p style={{ fontSize: 10, color: blue.muted, margin: 0 }}>Disponível por {mins} min</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Encomendas pendentes */}
        {pendingCount > 0 && (
          <button
            onClick={() => navigate("/morador/encomendas")}
            style={{
              borderRadius: 24, background: blue.primaryBg, border: `1px solid ${blue.primaryBorder}`,
              padding: 16, display: "flex", alignItems: "center", gap: 16,
              width: "100%", textAlign: "left", cursor: "pointer",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: `linear-gradient(135deg, ${blue.primary}, ${blue.primaryLight})`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Package size={24} color={blue.white} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: blue.dark, margin: 0 }}>
                Você tem {pendingCount} encomenda{pendingCount > 1 ? "s" : ""}!
              </p>
              <p style={{ fontSize: 12, color: blue.muted, margin: "2px 0 0" }}>Confira suas entregas pendentes</p>
            </div>
          </button>
        )}

        {/* Banners dinâmicos */}
        {banners.length > 0 && (
          <div
            onClick={() => {
              const link = banners[bannerIdx]?.link;
              if (link) window.open(link, "_blank");
            }}
            style={{
              borderRadius: 24, overflow: "hidden", position: "relative", height: 160, cursor: "pointer",
            }}
          >
            {banners[bannerIdx]?.imagem_url ? (
              <img
                src={banners[bannerIdx].imagem_url}
                alt={banners[bannerIdx].titulo}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${blue.dark} 0%, ${blue.primary} 100%)` }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(15,23,42,0.6), transparent)" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", padding: 20 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: blue.white, margin: 0 }}>{banners[bannerIdx]?.titulo}</p>
              {banners[bannerIdx]?.subtitulo && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: "4px 0 0" }}>{banners[bannerIdx].subtitulo}</p>
              )}
            </div>
            {banners.length > 1 && (
              <div style={{ position: "absolute", bottom: 8, right: 12, zIndex: 1, display: "flex", gap: 4 }}>
                {banners.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }}
                    style={{ width: 8, height: 8, borderRadius: "50%", background: i === bannerIdx ? blue.white : "rgba(255,255,255,0.4)", border: "none", cursor: "pointer" }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* News ticker */}
        {avisos.length > 0 && (
          <div style={{
            borderRadius: 999, background: blue.primary, padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 8, overflow: "hidden",
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: blue.white, textTransform: "uppercase",
              background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 999, flexShrink: 0,
            }}>News</span>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <p style={{
                fontSize: 12, fontWeight: 500, color: blue.white, margin: 0, whiteSpace: "nowrap",
                animation: "ticker 18s linear infinite",
              }}>
                {avisos.map((a: any, i: number) => (
                  <span key={a.id}>
                    {i > 0 && " • "}📢 {a.texto}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}

        {/* E-shop */}
        <div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: blue.muted, background: "#F1F5F9", padding: "2px 10px", borderRadius: 999 }}>De prestadores</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShoppingBag size={16} color={blue.primary} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: blue.dark, margin: 0 }}>Vitrine E-shop</h2>
            </div>
            <button onClick={() => navigate("/morador/produtos")} style={{ fontSize: 11, fontWeight: 600, color: blue.primary, textTransform: "uppercase", background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => scroll(shopRef, "left")} style={{
              position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10,
              width: 32, height: 32, borderRadius: "50%", background: blue.card, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChevronLeft size={16} color={blue.dark} />
            </button>
            <div ref={shopRef} style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 4px 8px", scrollbarWidth: "none" }}>
              {shopItems.map((product: any, idx: number) => (
                <button
                  key={product.id}
                  onClick={() => product.id.startsWith("mock") ? navigate("/morador/produtos") : navigate(`/morador/produtos/${product.id}`)}
                  style={{ flexShrink: 0, width: 140, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <div style={{ borderRadius: 20, overflow: "hidden", background: blue.card, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <div style={{ height: 100, overflow: "hidden" }}>
                      <img src={fallbackShopImages[idx % fallbackShopImages.length]} alt={product.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: 12 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: blue.primary, textTransform: "uppercase" }}>Loja</span>
                      <p style={{ fontSize: 13, fontWeight: 500, color: blue.dark, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.titulo}</p>
                      {product.preco != null && (
                        <p style={{ fontSize: 13, fontWeight: 700, color: blue.primary, margin: "4px 0 0" }}>
                          R$ {Number(product.preco).toFixed(2).replace(".", ",")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => scroll(shopRef, "right")} style={{
              position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10,
              width: 32, height: 32, borderRadius: "50%", background: blue.card, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChevronRight size={16} color={blue.dark} />
            </button>
          </div>
        </div>

        {/* Separador */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: blue.border }} />
          <span style={{ fontSize: 10, color: blue.muted }}>•</span>
          <div style={{ flex: 1, height: 1, background: blue.border }} />
        </div>

        {/* Desapego */}
        <div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: blue.muted, background: "#F1F5F9", padding: "2px 10px", borderRadius: 999 }}>Entre vizinhos</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Repeat size={16} color={blue.primary} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: blue.dark, margin: 0 }}>Desapego</h2>
            </div>
            <button onClick={() => navigate("/morador/desapegos")} style={{ fontSize: 11, fontWeight: 600, color: blue.primary, textTransform: "uppercase", background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => scroll(desapegoRef, "left")} style={{
              position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10,
              width: 32, height: 32, borderRadius: "50%", background: blue.card, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChevronLeft size={16} color={blue.dark} />
            </button>
            <div ref={desapegoRef} style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 4px 8px", scrollbarWidth: "none" }}>
              {desapegoItems.map((item: any, idx: number) => (
                <button
                  key={item.id}
                  onClick={() => item.id.startsWith("mock") ? navigate("/morador/desapegos") : navigate(`/morador/desapegos/${item.id}`)}
                  style={{ flexShrink: 0, width: 140, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <div style={{ borderRadius: 20, overflow: "hidden", background: blue.card, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <div style={{ height: 100, overflow: "hidden" }}>
                      <img src={fallbackDesapegoImages[idx % fallbackDesapegoImages.length]} alt={item.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: 12 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: blue.primary, textTransform: "uppercase" }}>Desapego</span>
                      <p style={{ fontSize: 13, fontWeight: 500, color: blue.dark, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.titulo}</p>
                      {item.preco != null && (
                        <p style={{ fontSize: 13, fontWeight: 700, color: blue.primary, margin: "4px 0 0" }}>
                          R$ {Number(item.preco).toFixed(2).replace(".", ",")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => scroll(desapegoRef, "right")} style={{
              position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", zIndex: 10,
              width: 32, height: 32, borderRadius: "50%", background: blue.card, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChevronRight size={16} color={blue.dark} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: blue.card, borderTop: `1px solid ${blue.border}`,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "10px 0 20px", zIndex: 50,
      }}>
        {[
          { icon: Home, label: "Início", active: true, path: "/preview-home" },
          { icon: Wrench, label: "Serviços", active: false, path: "/morador/servicos" },
          { icon: ShoppingBag, label: "Shop", active: false, path: "/morador/produtos" },
          { icon: Package, label: "Encomendas", active: false, path: "/morador/encomendas" },
          { icon: User, label: "Perfil", active: false, path: "/morador/perfil" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            <item.icon size={20} color={item.active ? blue.primary : blue.muted} strokeWidth={item.active ? 2.5 : 1.5} />
            <span style={{
              fontSize: 10, fontWeight: item.active ? 600 : 400,
              color: item.active ? blue.primary : blue.muted,
            }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PreviewHome;

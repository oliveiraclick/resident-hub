import { useRef } from "react";
import { 
  Package, ShoppingBag, ChevronLeft, ChevronRight, Repeat, MapPin, 
  Wrench, Droplets, Wifi, Scissors, Home, Search, Bell, User,
  Zap, PawPrint, Truck
} from "lucide-react";

import productBolo from "@/assets/product-bolo.jpg";
import productSabonete from "@/assets/product-sabonete.jpg";
import productBrigadeiro from "@/assets/product-brigadeiro.jpg";
import productVela from "@/assets/product-vela.jpg";
import desapegoBike from "@/assets/desapego-bike.jpg";
import desapegoSofa from "@/assets/desapego-sofa.jpg";
import desapegoLivros from "@/assets/desapego-livros.jpg";
import desapegoCarrinho from "@/assets/desapego-carrinho.jpg";

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

const mockCategories = [
  { nome: "Eletricista", icon: Zap },
  { nome: "Encanador", icon: Droplets },
  { nome: "Internet", icon: Wifi },
  { nome: "Pet Shop", icon: PawPrint },
];

const mockPrestadores = [
  { id: "1", nome: "Carlos M.", especialidade: "Eletricista", mins: 45 },
  { id: "2", nome: "Ana S.", especialidade: "Encanador", mins: 20 },
];

const mockProdutos = [
  { id: "1", titulo: "Bolo Caseiro", preco: 25, img: productBolo },
  { id: "2", titulo: "Sabonete Artesanal", preco: 12, img: productSabonete },
  { id: "3", titulo: "Brigadeiro Gourmet", preco: 3.5, img: productBrigadeiro },
  { id: "4", titulo: "Vela Aromática", preco: 18, img: productVela },
];

const mockDesapegos = [
  { id: "1", titulo: "Bicicleta Aro 29", preco: 450, img: desapegoBike },
  { id: "2", titulo: "Sofá 3 Lugares", preco: 800, img: desapegoSofa },
  { id: "3", titulo: "Livros Diversos", preco: 5, img: desapegoLivros },
  { id: "4", titulo: "Carrinho de Bebê", preco: 350, img: desapegoCarrinho },
];

const PreviewHome = () => {
  const shopRef = useRef<HTMLDivElement>(null);
  const desapegoRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  };

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
        {/* Search bar */}
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
        {/* Serviços */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: blue.dark, margin: 0 }}>Serviços</h2>
            <span style={{ fontSize: 11, fontWeight: 600, color: blue.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>Ver tudo</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {mockCategories.map((cat) => (
              <div key={cat.nome} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: blue.primaryBg, border: `1px solid ${blue.primaryBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <cat.icon size={22} color={blue.primary} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: blue.dark, textAlign: "center" }}>{cat.nome}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prestadores */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <MapPin size={16} color={blue.primary} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: blue.dark, margin: 0 }}>No condomínio agora</h2>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
            {mockPrestadores.map((p) => (
              <div key={p.id} style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 12,
                borderRadius: 16, background: blue.primaryBg, border: `1px solid ${blue.primaryBorder}`,
                padding: "12px 16px",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: blue.primary, display: "flex", alignItems: "center", justifyContent: "center",
                  color: blue.white, fontWeight: 700, fontSize: 14,
                }}>
                  {p.nome.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: blue.dark, margin: 0 }}>{p.nome}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: blue.primary, margin: 0 }}>{p.especialidade}</p>
                  <p style={{ fontSize: 10, color: blue.muted, margin: 0 }}>Disponível por {p.mins} min</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Encomendas */}
        <div style={{
          borderRadius: 24, background: blue.primaryBg, border: `1px solid ${blue.primaryBorder}`,
          padding: 16, display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: `linear-gradient(135deg, ${blue.primary}, ${blue.primaryLight})`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Package size={24} color={blue.white} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: blue.dark, margin: 0 }}>Você tem 3 encomendas!</p>
            <p style={{ fontSize: 12, color: blue.muted, margin: "2px 0 0" }}>Confira suas entregas pendentes</p>
          </div>
        </div>

        {/* Banner */}
        <div style={{
          borderRadius: 24, overflow: "hidden", position: "relative", height: 160,
          background: `linear-gradient(135deg, ${blue.dark} 0%, ${blue.primary} 100%)`,
        }}>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            justifyContent: "flex-end", padding: 20,
          }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: blue.white, margin: 0 }}>🎉 Festa Junina do Condomínio</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: "4px 0 0" }}>Dia 24 de Junho • Área de Lazer</p>
          </div>
          <div style={{ position: "absolute", bottom: 8, right: 12, display: "flex", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: blue.white }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
          </div>
        </div>

        {/* News ticker */}
        <div style={{
          borderRadius: 999, background: blue.primary, padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 8, overflow: "hidden",
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: blue.white, textTransform: "uppercase",
            background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 999, flexShrink: 0,
          }}>News</span>
          <p style={{ fontSize: 12, fontWeight: 500, color: blue.white, margin: 0, whiteSpace: "nowrap" }}>
            📢 Manutenção da piscina dia 20/02 • 📢 Assembleia marcada para sábado
          </p>
        </div>

        {/* E-shop */}
        <div>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: blue.muted,
              background: "#F1F5F9", padding: "2px 10px", borderRadius: 999,
            }}>De prestadores</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShoppingBag size={16} color={blue.primary} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: blue.dark, margin: 0 }}>Vitrine E-shop</h2>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: blue.primary, textTransform: "uppercase" }}>Ver tudo</span>
          </div>
          <div style={{ position: "relative" }}>
            <div ref={shopRef} style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 4px 8px" }}>
              {mockProdutos.map((p) => (
                <div key={p.id} style={{
                  flexShrink: 0, width: 140, borderRadius: 20, overflow: "hidden",
                  background: blue.card, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ height: 100, overflow: "hidden" }}>
                    <img src={p.img} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: 12 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: blue.primary, textTransform: "uppercase" }}>Loja</span>
                    <p style={{ fontSize: 13, fontWeight: 500, color: blue.dark, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.titulo}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: blue.primary, margin: "4px 0 0" }}>
                      R$ {p.preco.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: blue.border }} />
          <span style={{ fontSize: 10, color: blue.muted }}>•</span>
          <div style={{ flex: 1, height: 1, background: blue.border }} />
        </div>

        {/* Desapego */}
        <div>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: blue.muted,
              background: "#F1F5F9", padding: "2px 10px", borderRadius: 999,
            }}>Entre vizinhos</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Repeat size={16} color={blue.primary} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: blue.dark, margin: 0 }}>Desapego</h2>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: blue.primary, textTransform: "uppercase" }}>Ver tudo</span>
          </div>
          <div ref={desapegoRef} style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 4px 8px" }}>
            {mockDesapegos.map((item) => (
              <div key={item.id} style={{
                flexShrink: 0, width: 140, borderRadius: 20, overflow: "hidden",
                background: blue.card, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <div style={{ height: 100, overflow: "hidden" }}>
                  <img src={item.img} alt={item.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: 12 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: blue.primary, textTransform: "uppercase" }}>Desapego</span>
                  <p style={{ fontSize: 13, fontWeight: 500, color: blue.dark, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.titulo}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: blue.primary, margin: "4px 0 0" }}>
                    R$ {item.preco.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            ))}
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
          { icon: Home, label: "Início", active: true },
          { icon: Wrench, label: "Serviços", active: false },
          { icon: ShoppingBag, label: "Shop", active: false },
          { icon: Package, label: "Encomendas", active: false },
          { icon: User, label: "Perfil", active: false },
        ].map((item) => (
          <div key={item.label} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <item.icon size={20} color={item.active ? blue.primary : blue.muted} strokeWidth={item.active ? 2.5 : 1.5} />
            <span style={{
              fontSize: 10, fontWeight: item.active ? 600 : 400,
              color: item.active ? blue.primary : blue.muted,
            }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewHome;

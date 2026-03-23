import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, MessageCircle, CalendarCheck, CheckCircle, Star,
  Menu, X, Package, CalendarDays, ShoppingBag, Users, Download,
  QrCode, Home, Wrench, DoorOpen,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import logoSymbol from "@/assets/logo-symbol.png";
import heroBg from "@/assets/hero-building.jpg";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ─── Hook to fetch LP content ─── */
const useLpContent = () => {
  const [content, setContent] = useState<Record<string, Record<string, { valor: string; imagem_url: string | null }>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("lp_content")
      .select("secao, chave, valor, imagem_url")
      .order("ordem", { ascending: true })
      .then(({ data }) => {
        const map: typeof content = {};
        (data || []).forEach((row) => {
          if (!map[row.secao]) map[row.secao] = {};
          map[row.secao][row.chave] = { valor: row.valor, imagem_url: row.imagem_url };
        });
        setContent(map);
        setLoading(false);
      });
  }, []);

  const get = (secao: string, chave: string, fallback = "") =>
    content[secao]?.[chave]?.valor || fallback;

  const getImg = (secao: string, chave: string) =>
    content[secao]?.[chave]?.imagem_url || null;

  return { get, getImg, loading };
};

/* ─── Contact Form ─── */
const ContactForm = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contato_mensagens").insert({
      nome: nome.trim(), email: email.trim(),
      telefone: telefone.trim() || null, mensagem: mensagem.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
    } else {
      toast.success("Mensagem enviada! Entraremos em contato.");
      setNome(""); setEmail(""); setTelefone(""); setMensagem("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-left space-y-4">
      <Input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} required className="bg-white/10 border-white/20 text-foreground placeholder:text-muted-foreground" />
      <Input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150} required className="bg-white/10 border-white/20 text-foreground placeholder:text-muted-foreground" />
      <Input type="tel" placeholder="Seu celular" value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={20} required className="bg-white/10 border-white/20 text-foreground placeholder:text-muted-foreground" />
      <Textarea placeholder="Sua dúvida ou mensagem..." value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={1000} rows={4} required className="bg-white/10 border-white/20 text-foreground placeholder:text-muted-foreground" />
      <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={sending}>
        {sending ? "Enviando..." : "Enviar Mensagem"}
      </Button>
    </form>
  );
};

/* ─── Stats ─── */
const STATS = [
  { value: "2.4k+", label: "Moradores ativos" },
  { value: "87", label: "Condomínios" },
  { value: "15k+", label: "Encomendas/mês" },
];

/* ─── Features ─── */
const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Gestão Completa",
    desc: "Avisos, banners, encomendas e reservas de espaços em um só lugar.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace & Desapegos",
    desc: "Compre, venda e troque entre vizinhos de forma segura.",
  },
  {
    icon: Package,
    title: "Encomendas com QR",
    desc: "Rastreamento de encomendas do lote à retirada com QR Code.",
  },
  {
    icon: QrCode,
    title: "Visitantes via QR",
    desc: "Convide visitantes com segurança. Porteiro valida pelo app.",
  },
  {
    icon: Users,
    title: "Eventos Entre Amigos",
    desc: "Organize eventos, rateie despesas e solicite cotações.",
  },
];

/* ─── Modules ─── */
const MODULES = [
  {
    icon: Home,
    title: "Morador",
    desc: "Avisos, serviços, marketplace, encomendas, reservas, visitantes e eventos.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: ShieldCheck,
    title: "Admin & Porteiro",
    desc: "Gestão completa do condomínio, triagem de encomendas e validação por QR.",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    icon: Wrench,
    title: "Prestador",
    desc: "Cadastro de serviços, loja com cardápio, gestão de pedidos e cotações.",
    color: "bg-emerald-500/10 text-emerald-500",
  },
];

/* ─── Component ─── */
const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { get, getImg, loading } = useLpContent();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ────── HERO FULLSCREEN ────── */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Condomínio moderno"
            className="h-full w-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        </div>

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <img src={logoSymbol} alt="Morador.app" className="h-10" />
            <span className="text-white font-bold text-lg hidden sm:inline">Morador.app</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate("/auth")}
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Entrar
            </button>
            <Button
              size="sm"
              onClick={() => navigate("/cadastro/morador")}
              className="rounded-lg"
            >
              Criar conta
            </Button>
          </div>
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="relative z-10 md:hidden bg-black/80 backdrop-blur-md px-6 pb-4 flex flex-col gap-3">
            <Button variant="ghost" className="text-white justify-start" onClick={() => { navigate("/auth"); setMenuOpen(false); }}>Entrar</Button>
            <Button size="sm" onClick={() => { navigate("/cadastro/morador"); setMenuOpen(false); }}>Criar conta</Button>
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="max-w-7xl mx-auto w-full px-6 py-20">
            <div className="max-w-xl space-y-6">
              <p className="text-primary-light text-xs font-semibold uppercase tracking-[0.2em]">
                {get("hero", "badge", "Plataforma para condomínios")}
              </p>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1]">
                {get("hero", "titulo", "Seu condomínio,")}{" "}
                <span className="text-primary italic">
                  {get("hero", "titulo_destaque", "conectado")}
                </span>
              </h1>

              <p className="text-white/70 text-base md:text-lg max-w-md leading-relaxed">
                {get("hero", "subtitulo", "Avisos, marketplace, encomendas, visitantes e muito mais — tudo em uma plataforma feita para a vida em comunidade.")}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate("/cadastro/morador")}
                  className="rounded-xl text-base px-8 h-12"
                >
                  Começar agora
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="rounded-xl text-base px-8 h-12 text-white border border-white/30 hover:bg-white/10"
                  onClick={() => navigate("/auth")}
                >
                  Entrar
                </Button>
              </div>

              {/* Stats inline */}
              <div className="flex items-center gap-6 pt-6">
                {STATS.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-6">
                    {i > 0 && <div className="h-8 w-px bg-white/20" />}
                    <div>
                      <p className="text-white text-2xl font-bold">{s.value}</p>
                      <p className="text-white/50 text-xs">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────── FUNCIONALIDADES ────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">
              Funcionalidades
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              {get("beneficios", "titulo_secao", "Tudo que seu condomínio precisa")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {get("beneficios", "desc_secao", "Uma plataforma integrada para moradores, prestadores, administração e portaria.")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.slice(0, 3).map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-card border border-border p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-4"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <f.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6 max-w-2xl mx-auto">
            {FEATURES.slice(3).map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-card border border-border p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-4"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <f.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── MÓDULOS ────── */}
      <section className="py-20 md:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">
              Módulos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Uma plataforma, múltiplas visões
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {MODULES.map((m) => (
              <div
                key={m.title}
                className="rounded-2xl bg-background border border-border p-8 hover:shadow-xl transition-all duration-300 space-y-4"
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${m.color}`}>
                  <m.icon size={24} />
                </div>
                <h3 className="text-xl font-bold">{m.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── PREÇOS ────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">Planos</p>
            <h2 className="text-3xl md:text-4xl font-bold">{get("precos", "titulo_secao", "Simples e transparente")}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{get("precos", "desc_secao", "")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Morador */}
            <div className="rounded-2xl bg-card border border-border p-8 md:p-10 space-y-6 hover:shadow-lg transition-shadow">
              <div>
                <h3 className="font-bold text-xl">{get("precos", "morador_titulo", "Morador")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{get("precos", "morador_desc", "")}</p>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl md:text-5xl font-extrabold">{get("precos", "morador_preco", "Grátis")}</span>
                <span className="text-muted-foreground text-sm pb-1 ml-1">{get("precos", "morador_preco_sub", "")}</span>
              </div>
              <div className="h-px bg-border" />
              <ul className="space-y-3">
                {[1, 2, 3, 4].map((i) => {
                  const feat = get("precos", `morador_feat${i}`);
                  if (!feat) return null;
                  return (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle size={16} className="text-primary shrink-0" />
                      {feat}
                    </li>
                  );
                })}
              </ul>
              <Button variant="outline" className="w-full h-12 text-base font-semibold" onClick={() => navigate("/cadastro/morador")}>
                {get("precos", "morador_cta", "Começar grátis")}
              </Button>
            </div>

            {/* Prestador */}
            <div className="relative rounded-2xl bg-card border-2 border-primary p-8 md:p-10 space-y-6 shadow-xl ring-1 ring-primary/20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold px-5 py-1.5 shadow-lg uppercase tracking-wider">
                  <Star size={12} className="fill-current" /> Mais Popular
                </span>
              </div>
              <div className="pt-2">
                <h3 className="font-bold text-xl text-primary">{get("precos", "prestador_titulo", "Prestador")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{get("precos", "prestador_desc", "")}</p>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-sm text-muted-foreground line-through">R$ 49</span>
                <span className="text-4xl md:text-5xl font-extrabold text-primary">
                  {get("precos", "prestador_preco", "R$ 29").replace("R$ ", "")}
                </span>
                <span className="text-xs text-muted-foreground pb-1">{get("precos", "prestador_preco_sub", "/mês")}</span>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-2.5 text-center">
                <span className="text-sm font-semibold text-primary">🎉 60 dias grátis para experimentar</span>
              </div>
              <div className="h-px bg-border" />
              <ul className="space-y-3">
                {[1, 2, 3, 4].map((i) => {
                  const feat = get("precos", `prestador_feat${i}`);
                  if (!feat) return null;
                  return (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                      <CheckCircle size={16} className="text-primary shrink-0" />
                      {feat}
                    </li>
                  );
                })}
              </ul>
              <Button className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" onClick={() => navigate("/cadastro/prestador")}>
                {get("precos", "prestador_cta", "Começar teste grátis")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Cancele quando quiser · Sem fidelidade</p>
            </div>
          </div>
        </div>
      </section>

      {/* ────── DEPOIMENTOS ────── */}
      <section className="py-20 md:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-3xl md:text-4xl font-bold">{get("depoimentos", "titulo_secao", "O que dizem nossos usuários")}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => {
              const name = get("depoimentos", `dep${i}_nome`);
              const text = get("depoimentos", `dep${i}_texto`);
              const role = get("depoimentos", `dep${i}_role`);
              const stars = parseInt(get("depoimentos", `dep${i}_stars`, "5"));
              const img = getImg("depoimentos", `dep${i}_nome`);
              if (!name) return null;
              return (
                <div key={i} className="rounded-2xl bg-background border border-border p-6 space-y-4 hover:shadow-lg transition-shadow">
                  <div className="flex gap-0.5">
                    {Array.from({ length: stars }).map((_, j) => (
                      <Star key={j} size={16} className="fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">"{text}"</p>
                  <div className="flex items-center gap-3 pt-2">
                    {img ? (
                      <img src={img} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────── BAIXE O APP ────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
            <Download size={14} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Baixe o App</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Tenha o <span className="text-primary">Morador.app</span> no seu celular
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Escaneie o QR Code abaixo com a câmera do seu celular ou toque para baixar direto na loja.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-6">
            <a href="https://play.google.com/store/apps/details?id=app.morador.app" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-3 group">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm group-hover:shadow-md transition-shadow">
                <QRCodeSVG value="https://play.google.com/store/apps/details?id=app.morador.app" size={160} fgColor="hsl(var(--foreground))" bgColor="transparent" />
              </div>
              <span className="text-sm font-semibold">Android (Google Play)</span>
            </a>
            <a href="https://apps.apple.com/sa/app/o-morador/id6757885941" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-3 group">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm group-hover:shadow-md transition-shadow">
                <QRCodeSVG value="https://apps.apple.com/sa/app/o-morador/id6757885941" size={160} fgColor="hsl(var(--foreground))" bgColor="transparent" />
              </div>
              <span className="text-sm font-semibold">iOS (App Store)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ────── CTA FINAL ────── */}
      <section className="py-20 md:py-28 bg-header-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={heroBg} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            {get("cta_final", "titulo", "Transforme a gestão do seu condomínio")}
          </h2>
          <p className="text-white/70 max-w-md mx-auto">
            {get("cta_final", "subtitulo", "Comece gratuitamente e descubra como simplificar a vida em comunidade.")}
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-base px-10 h-14"
            onClick={() => navigate("/cadastro/morador")}
          >
            Criar conta grátis
          </Button>
        </div>
      </section>

      {/* ────── FORMULÁRIO ────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ficou com alguma dúvida?</h2>
          <p className="text-muted-foreground">Preencha o formulário abaixo e nossa equipe entrará em contato com você.</p>
          <ContactForm />
        </div>
      </section>

      {/* ────── FOOTER ────── */}
      <footer className="bg-header-bg text-white py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <img src={logoSymbol} alt="Morador.app" className="h-10" />
              <span className="font-bold">Morador.app</span>
            </div>
            <p className="text-xs text-white/50 max-w-[220px]">{get("footer", "slogan", "A plataforma completa para a vida em condomínio.")}</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Plataforma</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-white/50 hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="#" className="text-xs text-white/50 hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#" className="text-xs text-white/50 hover:text-white transition-colors">Prestadores</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Legal</h4>
            <ul className="space-y-2">
              <li><a href="/termos-de-uso" className="text-xs text-white/50 hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="/politica-privacidade" className="text-xs text-white/50 hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="/condicoes-de-uso" className="text-xs text-white/50 hover:text-white transition-colors">Condições de Uso</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Redes Sociais</h4>
            <div className="flex gap-3">
              <a href="#" className="text-white/50 hover:text-white transition-colors text-xs">Instagram</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-white/40">{get("footer", "copyright", "© 2025 Morador.app. Todos os direitos reservados.")}</p>
          <p className="text-xs text-white/40">{get("footer", "dev_by", "")}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

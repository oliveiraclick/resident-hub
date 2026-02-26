import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, MessageCircle, CalendarCheck, Play,
  CheckCircle, Star, Menu, X, Smartphone,
  Package, CalendarDays, ShoppingBag, Users, Target, BadgeCheck, Repeat, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMorador from "@/assets/logo-morador.png";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const get = (secao: string, chave: string, fallback = "") => {
    return content[secao]?.[chave]?.valor || fallback;
  };

  const getImg = (secao: string, chave: string) => {
    return content[secao]?.[chave]?.imagem_url || null;
  };

  return { get, getImg, loading };
};

/* ─── Constants ─── */
const NAV_LINKS = ["Benefícios", "Como Funciona", "Preços", "Depoimentos"];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "SECURITY+" },
  { icon: ShieldCheck, label: "ISO 27001" },
  { icon: Star, label: "EXCELÊNCIA" },
  { icon: CheckCircle, label: "CONDOMÍNIO TOP" },
];

const FEAT_ICONS = [ShieldCheck, MessageCircle, CalendarCheck];

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

  const features = [1, 2, 3].map((i) => ({
    icon: FEAT_ICONS[i - 1],
    title: get("beneficios", `feat${i}_titulo`),
    desc: get("beneficios", `feat${i}_desc`),
    img: getImg("beneficios", `feat${i}_titulo`),
  }));

  const steps = [1, 2, 3].map((i) => ({
    num: i,
    title: get("como_funciona", `passo${i}_titulo`),
    desc: get("como_funciona", `passo${i}_desc`),
  }));

  const moradorFeats = [1, 2, 3, 4].map((i) => get("precos", `morador_feat${i}`));
  const prestadorFeats = [1, 2, 3, 4].map((i) => get("precos", `prestador_feat${i}`));

  const testimonials = [1, 2, 3].map((i) => ({
    name: get("depoimentos", `dep${i}_nome`),
    role: get("depoimentos", `dep${i}_role`),
    text: get("depoimentos", `dep${i}_texto`),
    stars: parseInt(get("depoimentos", `dep${i}_stars`, "5")),
    img: getImg("depoimentos", `dep${i}_nome`),
  }));

  const heroImg = getImg("hero", "titulo");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ────── NAVBAR ────── */}
      <nav className="sticky top-0 z-50 bg-header-bg text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <img src={logoMorador} alt="Morador.app" className="h-14" />
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-white/80 hover:text-white transition-colors">
                {l}
              </a>
            ))}
            <Button size="sm" variant="ghost" className="text-white hover:text-white/90" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate("/cadastro/morador")}>
              Cadastre-se
            </Button>
          </div>
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 pb-4 flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-white/80 py-2" onClick={() => setMenuOpen(false)}>
                {l}
              </a>
            ))}
            <Button size="sm" variant="outline" className="border-white/30 text-white" onClick={() => navigate("/auth")}>Entrar</Button>
            <Button size="sm" onClick={() => navigate("/cadastro/morador")}>Cadastre-se</Button>
          </div>
        )}
      </nav>

      {/* ────── HERO ────── */}
      <section className="relative bg-header-bg text-white overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <span className="inline-block rounded-full bg-primary/20 px-4 py-1 text-xs font-medium text-primary-light">
            {get("hero", "badge")}
          </span>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              {get("hero", "titulo")}{" "}
              <span className="text-primary italic">{get("hero", "titulo_destaque")}</span>
            </h1>
            <p className="text-white/70 max-w-md text-body">{get("hero", "subtitulo")}</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate("/cadastro/morador")}>
                {get("hero", "cta_primario")}
              </Button>
              <Button size="lg" variant="ghost" className="border border-white/30 !text-white hover:bg-white/10 rounded-button">
                <Play size={16} className="mr-2" /> {get("hero", "cta_secundario")}
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-primary/60 border-2 border-header-bg" />
                ))}
              </div>
              <span className="text-xs text-white/60">{get("hero", "social_proof")}</span>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            {heroImg ? (
              <img src={heroImg} alt="Hero" className="max-h-[480px] rounded-3xl object-contain" />
            ) : (
              <div className="relative w-64 h-[480px] rounded-[2.5rem] border-4 border-white/20 bg-gradient-to-b from-primary/20 to-header-mid flex items-center justify-center">
                <Smartphone size={80} className="text-white/20" />
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                  <span className="text-xs text-white/40">Morador.app</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <svg viewBox="0 0 1440 80" className="w-full -mb-px" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="hsl(var(--background))" />
        </svg>
      </section>

      {/* ────── TRUST BADGES ────── */}
      <section className="py-8 border-b border-border">
        <div className="mx-auto max-w-4xl flex flex-wrap items-center justify-center gap-8 px-4">
          {TRUST_BADGES.map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-muted-foreground">
              <b.icon size={18} />
              <span className="text-xs font-semibold tracking-wider">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ────── FEATURES ────── */}
      <section id="benefícios" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {get("beneficios", "subtitulo_secao")}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold">{get("beneficios", "titulo_secao")}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-body">{get("beneficios", "desc_secao")}</p>
        </div>
        <div className="mx-auto max-w-6xl px-4 mt-12 grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-card bg-card p-8 border border-border hover:shadow-lg transition-shadow text-center space-y-4">
              {f.img ? (
                <img src={f.img} alt="" className="mx-auto h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <f.icon size={28} />
                </div>
              )}
              <h3 className="font-semibold text-title-md">{f.title}</h3>
              <p className="text-muted-foreground text-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────── COMO FUNCIONA ────── */}
      <section id="como-funciona" className="py-16 md:py-24 bg-card">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">{get("como_funciona", "titulo_secao")}</h2>
            <div className="space-y-8">
              {steps.map((s) => (
                <div key={s.num} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {s.num}
                  </div>
                  <div>
                    <h4 className="font-semibold">{s.title}</h4>
                    <p className="text-muted-foreground text-body mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            {getImg("como_funciona", "titulo_secao") ? (
              <img src={getImg("como_funciona", "titulo_secao")!} alt="" className="max-h-[420px] rounded-3xl object-contain" />
            ) : (
              <div className="relative w-56 h-[420px] rounded-[2rem] border-4 border-border bg-background shadow-xl flex flex-col items-center justify-end overflow-hidden">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-1.5 rounded-full bg-border" />
                <div className="w-full p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-primary">{get("como_funciona", "stat1")}</div>
                    <div className="text-3xl font-bold text-primary">{get("como_funciona", "stat2")}</div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                    <span>{get("como_funciona", "stat1_label")}</span>
                    <span>{get("como_funciona", "stat2_label")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ────── PARA CONDOMÍNIOS E MORADORES ────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Para Condomínios</span>
          <h2 className="text-2xl md:text-3xl font-bold">{get("para_condominio", "titulo_secao")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-body">{get("para_condominio", "desc_secao")}</p>
        </div>

        <div className="mx-auto max-w-6xl px-4 mt-12 grid md:grid-cols-2 gap-6">
          {[
            { icon: ShieldCheck, n: 1 },
            { icon: Package, n: 2 },
            { icon: CalendarDays, n: 3 },
            { icon: ShoppingBag, n: 4 },
          ].map(({ icon: Icon, n }) => (
            <div key={n} className="rounded-card bg-card border border-border p-6 flex gap-4 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon size={24} />
              </div>
              <div>
                <h4 className="font-semibold">{get("para_condominio", `ben${n}_titulo`)}</h4>
                <p className="text-muted-foreground text-body mt-1">{get("para_condominio", `ben${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mx-auto max-w-4xl px-4 mt-12 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center p-4 rounded-card bg-primary/5 border border-primary/10">
              <div className="text-2xl md:text-3xl font-bold text-primary">{get("para_condominio", `stat${i}`)}</div>
              <p className="text-xs text-muted-foreground mt-1">{get("para_condominio", `stat${i}_label`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────── PARA PRESTADORES ────── */}
      <section className="py-16 md:py-24 bg-header-bg text-white relative overflow-hidden">
        <svg viewBox="0 0 1440 80" className="absolute top-0 left-0 w-full -mt-px rotate-180" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="hsl(var(--background))" />
        </svg>

        <div className="mx-auto max-w-6xl px-4 pt-8 text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary-light">Para Prestadores</span>
          <h2 className="text-2xl md:text-3xl font-bold">{get("para_prestador", "titulo_secao")}</h2>
          <p className="text-white/70 max-w-xl mx-auto text-body">{get("para_prestador", "desc_secao")}</p>
        </div>

        <div className="mx-auto max-w-5xl px-4 mt-12 grid md:grid-cols-2 gap-6">
          {[
            { icon: Target, n: 1 },
            { icon: Users, n: 2 },
            { icon: BadgeCheck, n: 3 },
            { icon: Repeat, n: 4 },
          ].map(({ icon: Icon, n }) => (
            <div key={n} className="rounded-card bg-white/5 backdrop-blur border border-white/10 p-6 flex gap-4 hover:bg-white/10 transition-colors">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Icon size={24} />
              </div>
              <div>
                <h4 className="font-semibold">{get("para_prestador", `van${n}_titulo`)}</h4>
                <p className="text-white/60 text-body mt-1">{get("para_prestador", `van${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Destaque */}
        <div className="mx-auto max-w-3xl px-4 mt-10">
          <div className="rounded-card bg-primary/20 border border-primary/30 p-6 text-center flex items-center justify-center gap-3">
            <Zap size={24} className="text-primary shrink-0" />
            <p className="text-body font-medium">{get("para_prestador", "destaque")}</p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button size="lg" onClick={() => navigate("/cadastro/prestador")}>
            {get("para_prestador", "cta")}
          </Button>
        </div>

        <svg viewBox="0 0 1440 80" className="absolute bottom-0 left-0 w-full -mb-px" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="hsl(var(--background))" />
        </svg>
      </section>

      <section id="preços" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">{get("precos", "titulo_secao")}</h2>
          <p className="text-muted-foreground text-body">{get("precos", "desc_secao")}</p>
        </div>
        <div className="mx-auto max-w-3xl px-4 mt-12 grid md:grid-cols-2 gap-6">
          <div className="rounded-card border border-border bg-card p-8 space-y-6">
            <h3 className="font-bold text-lg">{get("precos", "morador_titulo")}</h3>
            <p className="text-muted-foreground text-body">{get("precos", "morador_desc")}</p>
            <div className="text-3xl font-bold">
              {get("precos", "morador_preco")} <span className="text-sm font-normal text-muted-foreground">{get("precos", "morador_preco_sub")}</span>
            </div>
            <ul className="space-y-3">
              {moradorFeats.map((f) => (
                <li key={f} className="flex items-center gap-2 text-body">
                  <CheckCircle size={16} className="text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={() => navigate("/cadastro/morador")}>
              {get("precos", "morador_cta")}
            </Button>
          </div>
          <div className="relative rounded-card border-2 border-primary bg-card p-8 space-y-6 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-bold px-4 py-1">
              MAIS POPULAR
            </span>
            <h3 className="font-bold text-lg text-primary">{get("precos", "prestador_titulo")}</h3>
            <p className="text-muted-foreground text-body">{get("precos", "prestador_desc")}</p>
            <div className="text-3xl font-bold">
              {get("precos", "prestador_preco")} <span className="text-sm font-normal text-muted-foreground">{get("precos", "prestador_preco_sub")}</span>
            </div>
            <ul className="space-y-3">
              {prestadorFeats.map((f) => (
                <li key={f} className="flex items-center gap-2 text-body">
                  <CheckCircle size={16} className="text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={() => navigate("/cadastro/prestador")}>
              {get("precos", "prestador_cta")}
            </Button>
          </div>
        </div>
      </section>

      {/* ────── TESTIMONIALS ────── */}
      <section id="depoimentos" className="py-16 md:py-24 bg-card">
        <div className="mx-auto max-w-6xl px-4 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">{get("depoimentos", "titulo_secao")}</h2>
        </div>
        <div className="mx-auto max-w-6xl px-4 mt-12 grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-card bg-background border border-border p-6 space-y-4">
              <div className="flex gap-1">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={16} className="fill-warning text-warning" />
                ))}
              </div>
              <p className="text-body text-muted-foreground italic">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2">
                {t.img ? (
                  <img src={t.img} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────── CTA FINAL ────── */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold">{get("cta_final", "titulo")}</h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto text-body">{get("cta_final", "subtitulo")}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-button" onClick={() => navigate("/cadastro/morador")}>
              {get("cta_final", "cta_morador")}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-button" onClick={() => navigate("/cadastro/prestador")}>
              {get("cta_final", "cta_prestador")}
            </Button>
          </div>
        </div>
      </section>

      {/* ────── FOOTER ────── */}
      <footer className="bg-header-bg text-white py-12">
        <div className="mx-auto max-w-6xl px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <img src={logoMorador} alt="Morador.app" className="h-12" />
            <p className="text-xs text-white/50 max-w-[200px]">{get("footer", "slogan")}</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Plataforma</h4>
            <ul className="space-y-2">
              {["Como Funciona", "Segurança", "Prestadores"].map((link) => (
                <li key={link}><a href="#" className="text-xs text-white/50 hover:text-white transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Empresa</h4>
            <ul className="space-y-2">
              {["Sobre nós", "Contato", "Termos de uso"].map((link) => (
                <li key={link}><a href="#" className="text-xs text-white/50 hover:text-white transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Redes Sociais</h4>
            <div className="flex gap-3">
              <a href="#" className="text-white/50 hover:text-white transition-colors text-xs">𝕏</a>
              <a href="#" className="text-white/50 hover:text-white transition-colors text-xs">▶</a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-white/40">{get("footer", "copyright")}</p>
          <p className="text-xs text-white/40">{get("footer", "dev_by")}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, MessageCircle, CalendarCheck, Play,
  CheckCircle, Star, ArrowRight, Menu, X,
  Smartphone, Users, Search, FileText, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMorador from "@/assets/logo-morador.png";
import { useState } from "react";

/* ─── Sections ─── */

const NAV_LINKS = ["Benefícios", "Como Funciona", "Preços", "Depoimentos"];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "SECURITY+" },
  { icon: ShieldCheck, label: "ISO 27001" },
  { icon: Star, label: "EXCELÊNCIA" },
  { icon: CheckCircle, label: "CONDOMÍNIO TOP" },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Segurança Verificada",
    desc: "Todos os prestadores passam por um rigoroso processo de checagem de antecedentes e referências.",
  },
  {
    icon: MessageCircle,
    title: "Comunicação Direta",
    desc: "Fale com prestadores e com a administração do seu condomínio de forma rápida e centralizada.",
  },
  {
    icon: CalendarCheck,
    title: "Agendamento Inteligente",
    desc: "Reserve áreas comuns ou agende reparos e atendimentos com poucos toques na tela do seu celular.",
  },
];

const STEPS = [
  {
    num: 1,
    title: "Cadastre-se Gratuitamente",
    desc: "Crie seu perfil como Morador ou Prestador em menos de 2 minutos.",
  },
  {
    num: 2,
    title: "Busque ou Ofereça Serviços",
    desc: "Encontre o que precisa através de filtros inteligentes ou publique seu serviço.",
  },
  {
    num: 3,
    title: "Resolva com um Clique",
    desc: "Peça pelo app, avalie o serviço e mantenha tudo organizado no seu histórico.",
  },
];

const MORADOR_FEATURES = [
  "Busca de prestadores",
  "Chat ilimitado",
  "Histórico de serviços",
  "Avaliação de profissionais",
];

const PRESTADOR_FEATURES = [
  "Perfil verificado",
  "Prioridade nas buscas",
  "Leads ilimitados",
  "Selo de Qualidade",
];

const TESTIMONIALS = [
  {
    name: "Ana Paula",
    role: "Moradora no Cond. Solar",
    stars: 5,
    text: "Muito mais fácil de gerenciar os problemas em casa. Encontrei um eletricista em 5 minutos e ele chegou em 20. Sensacional!",
  },
  {
    name: "Roberto Silva",
    role: "Encanador Autônomo",
    stars: 5,
    text: "Ótimo resultado, meu faturamento aumentou 40% desde que comecei a usar o Morador.app. A confiança do selo verificado faz toda a diferença.",
  },
  {
    name: "Carla Mendes",
    role: "Síndica Profissional",
    stars: 5,
    text: "Interface muito limpa e intuitiva. Até minha avó conseguiu usar para pedir um chaveiro. Parabéns aos desenvolvedores!",
  },
];

const FOOTER_COLS = [
  { title: "Plataforma", links: ["Como Funciona", "Segurança", "Prestadores"] },
  { title: "Empresa", links: ["Sobre nós", "Contato", "Termos de uso"] },
];

/* ─── Component ─── */

const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ────── NAVBAR ────── */}
      <nav className="sticky top-0 z-50 bg-header-bg text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <img src={logoMorador} alt="Morador.app" className="h-8" />

          {/* Desktop links */}
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

          {/* Mobile hamburger */}
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 pb-4 flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-white/80 py-2" onClick={() => setMenuOpen(false)}>
                {l}
              </a>
            ))}
            <Button size="sm" variant="outline" className="border-white/30 text-white" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate("/cadastro/morador")}>
              Cadastre-se
            </Button>
          </div>
        )}
      </nav>

      {/* ────── HERO ────── */}
      <section className="relative bg-header-bg text-white overflow-hidden">
        {/* Announcement */}
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <span className="inline-block rounded-full bg-primary/20 px-4 py-1 text-xs font-medium text-primary-light">
            🆕 Novo: Agora disponível em todo o Brasil
          </span>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Tudo o que você precisa no seu condomínio,{" "}
              <span className="text-primary italic">em um clique.</span>
            </h1>
            <p className="text-white/70 max-w-md text-body">
              Conectando moradores aos melhores prestadores de serviço com segurança, agilidade e total transparência. A revolução na gestão da sua rotina chegou.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate("/cadastro/morador")}>
                Começar agora gratuitamente
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Play size={16} className="mr-2" /> Ver vídeo
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-primary/60 border-2 border-header-bg" />
                ))}
              </div>
              <span className="text-xs text-white/60">
                <strong className="text-white">+1.000 moradores</strong> já estão facilitando suas vidas.
              </span>
            </div>
          </div>

          {/* Phone mockup placeholder */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-64 h-[480px] rounded-[2.5rem] border-4 border-white/20 bg-gradient-to-b from-primary/20 to-header-mid flex items-center justify-center">
              <Smartphone size={80} className="text-white/20" />
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                <span className="text-xs text-white/40">Morador.app</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
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

      {/* ────── FEATURES (POR QUE O MORADOR.APP?) ────── */}
      <section id="benefícios" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Por que o Morador.app?</span>
          <h2 className="text-2xl md:text-3xl font-bold">
            Uma experiência completa para<br />o seu dia a dia
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-body">
            Unimos tecnologia e conveniência para resolver problemas reais que você enfrenta no condomínio.
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-4 mt-12 grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-card bg-card p-8 border border-border hover:shadow-lg transition-shadow text-center space-y-4"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <f.icon size={28} />
              </div>
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
            <h2 className="text-2xl md:text-3xl font-bold">
              Como o Morador.app<br />facilita sua vida
            </h2>
            <div className="space-y-8">
              {STEPS.map((s) => (
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

          {/* Phone mockup */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-56 h-[420px] rounded-[2rem] border-4 border-border bg-background shadow-xl flex flex-col items-center justify-end overflow-hidden">
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-1.5 rounded-full bg-border" />
              <div className="w-full p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-primary">98%</div>
                  <div className="text-3xl font-bold text-primary">15min</div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                  <span>Satisfação</span>
                  <span>Tempo Resposta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────── PRICING ────── */}
      <section id="preços" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">Planos para todos</h2>
          <p className="text-muted-foreground text-body">
            Transparência total, sem letras miúdas ou taxas escondidas.
          </p>
        </div>

        <div className="mx-auto max-w-3xl px-4 mt-12 grid md:grid-cols-2 gap-6">
          {/* Morador */}
          <div className="rounded-card border border-border bg-card p-8 space-y-6">
            <h3 className="font-bold text-lg">Para Moradores</h3>
            <p className="text-muted-foreground text-body">Facilidade para sua rotina.</p>
            <div className="text-3xl font-bold">
              Grátis <span className="text-sm font-normal text-muted-foreground">sempre</span>
            </div>
            <ul className="space-y-3">
              {MORADOR_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-body">
                  <CheckCircle size={16} className="text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={() => navigate("/cadastro/morador")}>
              Criar conta grátis
            </Button>
          </div>

          {/* Prestador */}
          <div className="relative rounded-card border-2 border-primary bg-card p-8 space-y-6 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-bold px-4 py-1">
              MAIS POPULAR
            </span>
            <h3 className="font-bold text-lg text-primary">Para Prestadores</h3>
            <p className="text-muted-foreground text-body">Destaque seu trabalho.</p>
            <div className="text-3xl font-bold">
              R$ 49 <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </div>
            <ul className="space-y-3">
              {PRESTADOR_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-body">
                  <CheckCircle size={16} className="text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={() => navigate("/cadastro/prestador")}>
              Assinar Pro
            </Button>
          </div>
        </div>
      </section>

      {/* ────── TESTIMONIALS ────── */}
      <section id="depoimentos" className="py-16 md:py-24 bg-card">
        <div className="mx-auto max-w-6xl px-4 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">O que dizem nossos usuários</h2>
        </div>

        <div className="mx-auto max-w-6xl px-4 mt-12 grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-card bg-background border border-border p-6 space-y-4">
              <div className="flex gap-1">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={16} className="fill-warning text-warning" />
                ))}
              </div>
              <p className="text-body text-muted-foreground italic">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
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
          <h2 className="text-2xl md:text-4xl font-bold">
            Pronto para transformar<br />seu condomínio?
          </h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto text-body">
            Junte-se a milhares de pessoas que já simplificaram sua rotina hoje mesmo.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 rounded-button"
              onClick={() => navigate("/cadastro/morador")}
            >
              Cadastrar como Morador
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 rounded-button"
              onClick={() => navigate("/cadastro/prestador")}
            >
              Quero ser um Prestador
            </Button>
          </div>
        </div>
      </section>

      {/* ────── FOOTER ────── */}
      <footer className="bg-header-bg text-white py-12">
        <div className="mx-auto max-w-6xl px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <img src={logoMorador} alt="Morador.app" className="h-7" />
            <p className="text-xs text-white/50 max-w-[200px]">
              Conectando comunidades, facilitando vidas. O app número #1 para o seu condomínio.
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="space-y-3">
              <h4 className="font-semibold text-sm">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-white/50 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Redes Sociais</h4>
            <div className="flex gap-3">
              <a href="#" className="text-white/50 hover:text-white transition-colors text-xs">𝕏</a>
              <a href="#" className="text-white/50 hover:text-white transition-colors text-xs">▶</a>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-white/40">© 2024 Morador.app. Todos os direitos reservados.</p>
          <p className="text-xs text-white/40">Desenvolvido por ia&co. tecnologia</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

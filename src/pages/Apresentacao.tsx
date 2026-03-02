import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Home, Users, Briefcase, Shield, QrCode, Package, Star, CreditCard, Smartphone, ArrowRight, Building2, Heart, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TOTAL_SLIDES = 10;

const Apresentacao = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, TOTAL_SLIDES - 1)), []);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, navigate]);

  return (
    <div className="fixed inset-0 bg-[hsl(240,29%,10%)] flex flex-col select-none">
      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* Nav arrows */}
        <button
          onClick={prev}
          disabled={current === 0}
          className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-20 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={next}
          disabled={current === TOTAL_SLIDES - 1}
          className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-20 transition-all"
        >
          <ChevronRight size={24} />
        </button>

        {/* Slide content */}
        <div className="w-full max-w-5xl mx-auto px-6 md:px-12">
          <SlideContent index={current} />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="h-16 flex items-center justify-between px-6 border-t border-white/10">
        <button onClick={() => navigate("/")} className="text-white/50 hover:text-white text-sm transition-colors">
          ← Voltar ao site
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === current ? 24 : 8,
                background: i === current ? "hsl(14,100%,57%)" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
        <span className="text-white/40 text-sm font-mono">{current + 1}/{TOTAL_SLIDES}</span>
      </div>
    </div>
  );
};

const SlideContent = ({ index }: { index: number }) => {
  const slides = [
    <SlideCover key={0} />,
    <SlideProblema key={1} />,
    <SlideSolucao key={2} />,
    <SlideMoradores key={3} />,
    <SlidePrestadores key={4} />,
    <SlideAdmin key={5} />,
    <SlideQrCode key={6} />,
    <SlidePrecos key={7} />,
    <SlideDiferenciais key={8} />,
    <SlideFinal key={9} />,
  ];
  return (
    <div className="animate-fade-in" key={index}>
      {slides[index]}
    </div>
  );
};

/* ─── Individual Slides ─── */

const SlideCover = () => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-[hsl(14,100%,57%)] to-[hsl(14,100%,45%)] mb-8 shadow-2xl shadow-orange-500/30">
      <Home size={40} className="text-white" />
    </div>
    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight">
      Morador<span className="text-[hsl(14,100%,57%)]">.app</span>
    </h1>
    <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed">
      Tudo o que você precisa no seu condomínio,<br />a um clique de distância.
    </p>
    <div className="mt-10 flex items-center justify-center gap-3 text-white/30 text-sm">
      <Smartphone size={16} /> Android · iOS · Web
    </div>
  </div>
);

const SlideProblema = () => (
  <div>
    <Badge label="O Problema" />
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
      A comunicação no condomínio<br />ainda é <span className="text-red-400">analógica</span>
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      {[
        "Dificuldade de encontrar prestadores confiáveis",
        "Encomendas sem rastreamento na portaria",
        "Reservas de espaços por papel ou WhatsApp",
        "Autorização de visitantes por interfone",
        "Itens parados em casa sem uso",
        "Comunicação fragmentada entre moradores",
      ].map((t, i) => (
        <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
          <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
            <span className="text-red-400 text-xs font-bold">✕</span>
          </div>
          <p className="text-white/70 text-[15px]">{t}</p>
        </div>
      ))}
    </div>
  </div>
);

const SlideSolucao = () => (
  <div>
    <Badge label="A Solução" />
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
      Uma plataforma <span className="text-[hsl(14,100%,57%)]">completa</span><br />para seu condomínio
    </h2>
    <p className="text-lg text-white/50 mb-8 max-w-xl">
      O Morador.app conecta moradores, prestadores e administradores em um ecossistema digital integrado.
    </p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl">
      {[
        { icon: Users, label: "Serviços" },
        { icon: Package, label: "Encomendas" },
        { icon: QrCode, label: "Visitantes" },
        { icon: Heart, label: "Desapegos" },
        { icon: Building2, label: "Reservas" },
        { icon: Star, label: "Avaliações" },
      ].map(({ icon: Icon, label }, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center hover:bg-white/10 transition-colors">
          <Icon size={28} className="text-[hsl(14,100%,57%)] mx-auto mb-2" />
          <p className="text-white font-semibold text-sm">{label}</p>
        </div>
      ))}
    </div>
  </div>
);

const SlideMoradores = () => (
  <div>
    <Badge label="Para Moradores" color="emerald" />
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
      Gratuito para <span className="text-emerald-400">moradores</span>
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      {[
        { title: "Serviços", desc: "Encontre prestadores avaliados do seu condomínio" },
        { title: "Produtos", desc: "Compre de vizinhos e prestadores locais" },
        { title: "Desapegos", desc: "Venda ou doe itens que não usa mais" },
        { title: "Visitantes", desc: "Autorize com QR Code digital na portaria" },
        { title: "Encomendas", desc: "Saiba quando seu pacote chegou" },
        { title: "Reservas", desc: "Agende espaços comuns online" },
      ].map((item, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white font-bold text-[15px] mb-1">{item.title}</p>
          <p className="text-white/50 text-sm">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const SlidePrestadores = () => (
  <div>
    <Badge label="Para Prestadores" color="blue" />
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
      Sua vitrine dentro do <span className="text-blue-400">condomínio</span>
    </h2>
    <div className="flex flex-col gap-4 max-w-2xl">
      {[
        { title: "Perfil profissional", desc: "Destaque sua especialidade e receba avaliações" },
        { title: "Produtos & Serviços", desc: "Publique com foto, descrição e preço" },
        { title: "Multi-condomínio", desc: "Atue em vários condomínios simultaneamente" },
        { title: "Gestão financeira", desc: "Acompanhe receitas e pagamentos" },
        { title: "Indique e Ganhe", desc: "A cada 5 indicações = 1 mês grátis" },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
            <ArrowRight size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-white font-bold text-[15px]">{item.title}</p>
            <p className="text-white/50 text-sm">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SlideAdmin = () => (
  <div>
    <Badge label="Para Administradores" color="purple" />
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
      Gestão <span className="text-purple-400">simplificada</span>
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      {[
        { icon: Users, title: "Moradores & Prestadores", desc: "Gerencie cadastros e aprovações" },
        { icon: Package, title: "Encomendas", desc: "Sistema completo com lotes, triagem e retirada" },
        { icon: Shield, title: "Portaria Digital", desc: "QR Code para visitantes com registro fotográfico" },
        { icon: Briefcase, title: "Financeiro", desc: "Controle de receitas e despesas" },
      ].map(({ icon: Icon, ...item }, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10">
          <Icon size={24} className="text-purple-400 mb-3" />
          <p className="text-white font-bold text-[15px] mb-1">{item.title}</p>
          <p className="text-white/50 text-sm">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const SlideQrCode = () => (
  <div className="text-center">
    <Badge label="Tecnologia" />
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
      QR Code em <span className="text-[hsl(14,100%,57%)]">tudo</span>
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
      {[
        { icon: QrCode, title: "Visitantes", desc: "Convite digital com QR Code validado na portaria" },
        { icon: Package, title: "Encomendas", desc: "Rastreio e retirada via leitura de código" },
        { icon: Users, title: "Identificação", desc: "QR ID do morador para acesso rápido" },
      ].map(({ icon: Icon, ...item }, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="h-16 w-16 rounded-2xl bg-[hsl(14,100%,57%)]/15 flex items-center justify-center mx-auto mb-4">
            <Icon size={32} className="text-[hsl(14,100%,57%)]" />
          </div>
          <p className="text-white font-bold mb-1">{item.title}</p>
          <p className="text-white/50 text-sm">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const SlidePrecos = () => (
  <div className="text-center">
    <Badge label="Preços" />
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
      Simples e <span className="text-[hsl(14,100%,57%)]">acessível</span>
    </h2>
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-3xl mx-auto">
      {/* Moradores */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-8 max-w-xs w-full">
        <p className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-2">Moradores</p>
        <p className="text-5xl font-extrabold text-emerald-400 mb-1">Grátis</p>
        <p className="text-white/40 text-sm mb-6">Para sempre</p>
        <ul className="text-left text-white/60 text-sm space-y-2">
          {["Serviços", "Produtos", "Desapegos", "Visitantes", "Encomendas", "Reservas"].map((f) => (
            <li key={f} className="flex items-center gap-2"><span className="text-emerald-400">✓</span> {f}</li>
          ))}
        </ul>
      </div>

      {/* Prestadores */}
      <div className="flex-1 bg-[hsl(14,100%,57%)]/10 border-2 border-[hsl(14,100%,57%)]/30 rounded-2xl p-8 max-w-xs w-full relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[hsl(14,100%,57%)] text-white text-xs font-bold px-3 py-1 rounded-full">
          60 dias grátis
        </div>
        <p className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-2">Prestadores</p>
        <p className="text-5xl font-extrabold text-white mb-1">R$ 29<span className="text-2xl">,90</span></p>
        <p className="text-white/40 text-sm mb-6">/mês</p>
        <ul className="text-left text-white/60 text-sm space-y-2">
          {["Perfil profissional", "Vitrine de produtos", "Multi-condomínio", "Gestão financeira", "Programa de indicação"].map((f) => (
            <li key={f} className="flex items-center gap-2"><span className="text-[hsl(14,100%,57%)]">✓</span> {f}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const SlideDiferenciais = () => (
  <div>
    <Badge label="Diferenciais" />
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
      Por que o <span className="text-[hsl(14,100%,57%)]">Morador.app</span>?
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      {[
        { icon: Heart, title: "Gratuito para moradores", desc: "Sem barreira de entrada – todos participam" },
        { icon: Zap, title: "Ecossistema completo", desc: "Não é só serviços, é convivência digital" },
        { icon: Star, title: "Avaliações reais", desc: "Moradores avaliam, gerando confiança" },
        { icon: Building2, title: "Multi-condomínio", desc: "Prestadores atuam em vários locais" },
        { icon: QrCode, title: "QR Code integrado", desc: "Visitantes, encomendas e identificação" },
        { icon: CreditCard, title: "Indicação premiada", desc: "5 indicações = 1 mês grátis" },
      ].map(({ icon: Icon, ...item }, i) => (
        <div key={i} className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="h-10 w-10 rounded-xl bg-[hsl(14,100%,57%)]/15 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-[hsl(14,100%,57%)]" />
          </div>
          <div>
            <p className="text-white font-bold text-[15px]">{item.title}</p>
            <p className="text-white/50 text-sm">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SlideFinal = () => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-[hsl(14,100%,57%)] to-[hsl(14,100%,45%)] mb-8 shadow-2xl shadow-orange-500/30">
      <Home size={40} className="text-white" />
    </div>
    <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
      Morador<span className="text-[hsl(14,100%,57%)]">.app</span>
    </h2>
    <p className="text-xl text-white/50 mb-10 max-w-lg mx-auto">
      Transformando a convivência em condomínios com tecnologia simples e acessível.
    </p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <a
        href="https://play.google.com/store/apps/details?id=app.morador.app"
        target="_blank"
        rel="noopener noreferrer"
        className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-2 transition-colors"
      >
        <Smartphone size={18} /> Google Play
      </a>
      <a
        href="https://apps.apple.com/sa/app/o-morador/id6757885941"
        target="_blank"
        rel="noopener noreferrer"
        className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-2 transition-colors"
      >
        <Smartphone size={18} /> App Store
      </a>
    </div>
    <p className="text-white/20 text-sm mt-8">morador.app</p>
  </div>
);

/* ─── Helpers ─── */

const Badge = ({ label, color = "orange" }: { label: string; color?: string }) => {
  const colors: Record<string, string> = {
    orange: "bg-[hsl(14,100%,57%)]/15 text-[hsl(14,100%,57%)]",
    emerald: "bg-emerald-500/15 text-emerald-400",
    blue: "bg-blue-500/15 text-blue-400",
    purple: "bg-purple-500/15 text-purple-400",
  };
  return (
    <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4 ${colors[color] || colors.orange}`}>
      {label}
    </span>
  );
};

export default Apresentacao;

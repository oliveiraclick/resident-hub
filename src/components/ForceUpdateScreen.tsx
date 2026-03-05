import { Smartphone, Download, ArrowUpCircle, ShieldAlert } from "lucide-react";
import { NATIVE_APP_VERSION } from "@/lib/appVersion";

/**
 * Versão mínima exigida para o app nativo.
 * Quando você publicar uma nova versão obrigatória, atualize aqui.
 */
const MIN_NATIVE_VERSION = "3.2.0";

function isNativeApp(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("native") === "1" || /\b(capacitor|wv)\b/i.test(navigator.userAgent);
}

function isVersionOutdated(current: string, minimum: string): boolean {
  const cur = current.split(".").map(Number);
  const min = minimum.split(".").map(Number);
  for (let i = 0; i < Math.max(cur.length, min.length); i++) {
    const c = cur[i] || 0;
    const m = min[i] || 0;
    if (c < m) return true;
    if (c > m) return false;
  }
  return false;
}

function getStoreUrl(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "https://apps.apple.com/sa/app/o-morador/id6757885941";
  }
  return "https://play.google.com/store/apps/details?id=app.morador.app";
}

const ForceUpdateScreen = () => {
  if (!isNativeApp()) return null;
  if (!isVersionOutdated(NATIVE_APP_VERSION, MIN_NATIVE_VERSION)) return null;

  const storeUrl = getStoreUrl();
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: "linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(var(--header-bg)) 50%, #0f172a 100%)",
      }}
    >
      {/* Animated icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: "rgba(255,255,255,0.3)", animationDuration: "2s" }}
        />
        <div className="relative h-28 w-28 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)" }}
        >
          <ArrowUpCircle size={56} className="text-white" strokeWidth={1.5} />
        </div>
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full mb-6"
        style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
      >
        <ShieldAlert size={14} className="text-yellow-300" />
        <span className="text-[11px] font-bold text-yellow-200 uppercase tracking-wider">Atualização Obrigatória</span>
      </div>

      <h1 className="text-[26px] font-extrabold text-white leading-tight mb-3">
        Nova versão disponível! 🚀
      </h1>

      <p className="text-[15px] text-white/80 max-w-xs leading-relaxed mb-2">
        Atualizamos o app com <strong className="text-white">melhorias importantes</strong> de segurança,
        desempenho e novas funcionalidades.
      </p>

      <p className="text-[13px] text-white/50 mb-8">
        Versão atual: <span className="font-mono">{NATIVE_APP_VERSION}</span> → Mínima: <span className="font-mono">{MIN_NATIVE_VERSION}</span>
      </p>

      {/* CTA Button */}
      <a
        href={storeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-8 py-4 rounded-2xl text-[16px] font-bold shadow-2xl active:scale-95 transition-transform"
        style={{
          background: "rgba(255,255,255,0.95)",
          color: "hsl(var(--primary))",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 60px rgba(255,255,255,0.1)",
        }}
      >
        <Download size={22} />
        Atualizar na {isIOS ? "App Store" : "Play Store"}
      </a>

      {/* Subtle info */}
      <div className="flex items-center gap-2 mt-8 text-white/40">
        <Smartphone size={14} />
        <span className="text-[11px]">O app será atualizado em instantes</span>
      </div>
    </div>
  );
};

export default ForceUpdateScreen;

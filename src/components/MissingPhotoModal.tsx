import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { APP_VERSION, NATIVE_APP_VERSION } from "@/lib/appVersion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Download, ImageOff } from "lucide-react";

const DISMISSED_KEY = "missing_photo_modal_dismissed";

const MissingPhotoModal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [missingProducts, setMissingProducts] = useState(0);
  const [missingDesapegos, setMissingDesapegos] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Don't show more than once per session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const check = async () => {
      const [prodRes, desRes] = await Promise.all([
        supabase
          .from("produtos")
          .select("id", { count: "exact", head: true })
          .eq("prestador_id", user.id)
          .eq("status", "ativo")
          .or("imagem_url.is.null,imagem_url.eq."),
        supabase
          .from("desapegos")
          .select("id", { count: "exact", head: true })
          .eq("morador_id", user.id)
          .eq("status", "ativo")
          .or("imagem_url.is.null,imagem_url.eq."),
      ]);

      const pCount = prodRes.count || 0;
      const dCount = desRes.count || 0;

      if (pCount > 0 || dCount > 0) {
        setMissingProducts(pCount);
        setMissingDesapegos(dCount);
        setOpen(true);
      }
    };

    // Small delay to avoid blocking initial render
    const timer = setTimeout(check, 2500);
    return () => clearTimeout(timer);
  }, [user]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  };

  const handleGoToProducts = () => {
    handleDismiss();
    navigate("/prestador/produtos");
  };

  const handleGoToDesapegos = () => {
    handleDismiss();
    navigate("/morador/desapegos");
  };

  const isNative =
    new URLSearchParams(window.location.search).get("native") === "1" ||
    /\b(capacitor|wv)\b/i.test(navigator.userAgent);

  const total = missingProducts + missingDesapegos;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-[360px] rounded-2xl p-0 overflow-hidden gap-0">
        {/* Header gradient */}
        <div
          className="px-6 pt-7 pb-5 text-center"
          style={{
            background: "linear-gradient(145deg, hsl(var(--header-bg)) 0%, hsl(var(--primary)) 100%)",
          }}
        >
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-white/15 flex items-center justify-center" style={{ backdropFilter: "blur(8px)" }}>
            <ImageOff size={28} className="text-white" />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-white text-lg font-bold">
              {total} anúncio{total > 1 ? "s" : ""} sem foto
            </DialogTitle>
            <DialogDescription className="text-white/70 text-[13px]">
              Anúncios com foto vendem até 3x mais!
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6 flex flex-col gap-4">
          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            {missingProducts > 0 && (
              <Button onClick={handleGoToProducts} className="gap-2 h-11 rounded-xl">
                <Camera size={16} />
                Adicionar foto aos produtos ({missingProducts})
              </Button>
            )}
            {missingDesapegos > 0 && (
              <Button onClick={handleGoToDesapegos} variant="outline" className="gap-2 h-11 rounded-xl">
                <Camera size={16} />
                Adicionar foto aos desapegos ({missingDesapegos})
              </Button>
            )}
          </div>

          {/* App update section */}
          <div className="border-t border-border pt-4 mt-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 text-center">
              Atualize o app para a melhor experiência
            </p>
            <div className="flex gap-2">
              <a
                href="https://play.google.com/store/apps/details?id=app.morador.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-card text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M3.609 1.814 13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893 2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.38 2.302 1.33a1 1 0 0 1 0 1.685l-2.302 1.33-2.533-2.533 2.533-2.533zM5.864 3.458l10.937 6.333-2.302 2.302L5.864 3.458z" />
                </svg>
                Android
              </a>
              <a
                href="https://apps.apple.com/sa/app/o-morador/id6757885941"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-card text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                iOS
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
              {isNative ? `App ${NATIVE_APP_VERSION} · Base ${APP_VERSION}` : `Web · Base ${APP_VERSION}`}
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
          >
            Lembrar mais tarde
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MissingPhotoModal;

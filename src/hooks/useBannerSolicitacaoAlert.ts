import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Escuta em tempo real novas solicitações de banner (INSERT)
 * e emite um alerta sonoro + toast destacado para o platform_admin.
 */
export function useBannerSolicitacaoAlert() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Pre-create audio element with a notification sound (Web Audio beep fallback)
    const playAlert = () => {
      try {
        const ctx = new AudioContext();
        // Two-tone beep for attention
        [660, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.value = 0.3;
          osc.start(ctx.currentTime + i * 0.2);
          osc.stop(ctx.currentTime + i * 0.2 + 0.15);
        });
      } catch {
        // Silently fail if AudioContext is blocked
      }
    };

    const channel = supabase
      .channel("banner-solicitacoes-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "banner_solicitacoes",
        },
        () => {
          playAlert();
          toast("🚨 Nova solicitação de banner!", {
            description: "Um prestador acabou de solicitar um espaço de banner. Verifique agora!",
            duration: 15000,
            action: {
              label: "Ver agora",
              onClick: () => {
                window.location.href = "/master/banner-solicitacoes";
              },
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

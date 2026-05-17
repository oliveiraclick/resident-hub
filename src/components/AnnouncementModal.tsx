import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Check, MapPin } from "lucide-react";

const STORAGE_KEY = "pending_packages_shown";

const getShownIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

export const AnnouncementModal = () => {
  const { user } = useAuth();
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchPacotes = async () => {
      const { data } = await supabase
        .from("pacotes")
        .select("id, descricao, localizacao, codigo_rastreio, recebido_em")
        .eq("morador_id", user.id)
        .eq("status", "AGUARDANDO_RETIRADA")
        .order("recebido_em", { ascending: false });

      if (!data || data.length === 0) return;

      const shown = getShownIds();
      const novos = data.filter((p) => !shown.includes(p.id));
      if (novos.length > 0) {
        // Pequeno delay para não aparecer instantaneamente
        setTimeout(() => {
          setPacotes(novos);
          setOpen(true);
        }, 1200);
      }
    };

    fetchPacotes();
  }, [user]);

  const handleClose = () => {
    const shown = getShownIds();
    const ids = pacotes.map((p) => p.id);
    const merged = Array.from(new Set([...shown, ...ids]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    setOpen(false);
  };

  if (pacotes.length === 0) return null;

  const total = pacotes.length;
  const principal = pacotes[0];

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl bg-gradient-to-b from-white to-primary/5 p-0 overflow-hidden">
        <div className="relative h-32 bg-primary flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          </div>
          <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white animate-in zoom-in duration-500">
            <Package size={40} strokeWidth={2.5} />
          </div>
        </div>

        <div className="p-8 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center text-foreground leading-tight">
              {total === 1
                ? "Você tem 1 encomenda pendente!"
                : `Você tem ${total} encomendas pendentes!`}
            </DialogTitle>
            <DialogDescription className="text-center text-base font-medium pt-2">
              {total === 1
                ? "Uma encomenda chegou e está aguardando você na portaria."
                : "Suas encomendas estão aguardando retirada na portaria."}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-2">
            {principal.descricao && (
              <p className="text-sm font-bold text-foreground text-center">
                📦 {principal.descricao}
              </p>
            )}
            {principal.localizacao && (
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin size={14} />
                <span>{principal.localizacao}</span>
              </div>
            )}
            {total > 1 && (
              <p className="text-xs font-semibold text-center text-muted-foreground pt-1">
                + {total - 1} outra(s) encomenda(s)
              </p>
            )}
          </div>

          <DialogFooter className="sm:justify-center pt-2">
            <Button
              className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              onClick={handleClose}
            >
              <Check className="mr-2 h-5 w-5" /> OK, entendi!
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

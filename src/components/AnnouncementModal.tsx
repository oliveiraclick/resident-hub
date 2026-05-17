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
      <DialogContent className="max-w-[300px] sm:max-w-[320px] rounded-[20px] border-none shadow-2xl bg-gradient-to-b from-white to-primary/5 p-0 overflow-hidden max-h-[90vh]">
        <div className="relative h-16 bg-primary flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-12 h-12 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          </div>
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white animate-in zoom-in duration-500">
            <Package size={22} strokeWidth={2.5} />
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-center text-foreground leading-tight">
              {total === 1
                ? "Encomenda pendente!"
                : `${total} encomendas pendentes!`}
            </DialogTitle>
            <DialogDescription className="text-center text-xs font-medium pt-0.5">
              Aguardando você na portaria.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10 space-y-1">
            {principal.descricao && (
              <p className="text-[13px] font-bold text-foreground text-center line-clamp-1">
                📦 {principal.descricao}
              </p>
            )}
            {principal.localizacao && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <MapPin size={10} />
                <span>{principal.localizacao}</span>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-center pt-0.5">
            <Button
              className="w-full h-10 rounded-lg font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              onClick={handleClose}
            >
              <Check className="mr-1.5 h-4 w-4" /> OK, entendi!
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

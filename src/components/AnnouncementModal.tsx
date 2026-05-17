import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";

export const AnnouncementModal = () => {
  const [open, setOpen] = useState(false);
  const STORAGE_KEY = "announcement_viewed_responsive_update";

  useEffect(() => {
    const hasViewed = localStorage.getItem(STORAGE_KEY);
    if (!hasViewed) {
      // Pequeno delay para não aparecer instantaneamente antes da página carregar
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleClose();
    }}>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl bg-gradient-to-b from-white to-primary/5 p-0 overflow-hidden">
        <div className="relative h-32 bg-primary flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          </div>
          <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white rotate-12 animate-in zoom-in duration-500">
            <Sparkles size={40} className="fill-white" />
          </div>
        </div>
        
        <div className="p-8 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center text-foreground leading-tight">
              Novidades Incríveis Chegaram!
            </DialogTitle>
            <DialogDescription className="text-center text-base font-medium pt-2">
              Nossa plataforma agora é <span className="text-primary font-bold italic">100% Responsiva</span>! 
              <br /><br />
              Aproveite uma experiência perfeita em seu smartphone, tablet ou computador. Navegação fluida e visual impecável em qualquer tela.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <p className="text-sm font-semibold text-center text-muted-foreground">
              Estamos evoluindo para oferecer o melhor para você. Em breve, novas funcionalidades estarão disponíveis!
            </p>
          </div>

          <DialogFooter className="sm:justify-center pt-2">
            <Button 
              className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" 
              onClick={handleClose}
            >
              <Check className="mr-2 h-5 w-5" /> Entendi, vamos lá!
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

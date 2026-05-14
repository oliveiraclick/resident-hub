import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, MapPin, Check, X } from "lucide-react";
import { toast } from "sonner";

export const PreReservaPopup = () => {
  const { user } = useAuth();
  const [preReserva, setPreReserva] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchPreReserva = async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("id, data, horario_inicio, horario_fim, expira_em, espacos(nome)")
        .eq("morador_id", user.id)
        .eq("status", "pre_reserva")
        .order("expira_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.expira_em) {
        const expiresAt = new Date(data.expira_em).getTime();
        if (expiresAt > Date.now()) {
          setPreReserva(data);
          setOpen(true);
        }
      }
    };

    fetchPreReserva();

    // Check every 30 seconds for new pre-reservations
    const interval = setInterval(fetchPreReserva, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (open) {
      const timer = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [open]);

  const formatTimeRemaining = (expiry: string) => {
    const ms = new Date(expiry).getTime() - now;
    if (ms <= 0) return "Expirado";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleConfirm = async () => {
    if (!preReserva) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("reservas")
      .update({ status: "confirmada", expira_em: null } as any)
      .eq("id", preReserva.id);

    if (error) {
      toast.error("Erro ao confirmar reserva");
    } else {
      toast.success("Reserva confirmada com sucesso!");
      setOpen(false);
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    if (!preReserva) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("reservas")
      .delete()
      .eq("id", preReserva.id);

    if (error) {
      toast.error("Erro ao cancelar reserva");
    } else {
      toast.success("Reserva cancelada");
      setOpen(false);
    }
    setSubmitting(false);
  };

  if (!preReserva) return null;

  const isExpired = new Date(preReserva.expira_em).getTime() < now;

  if (isExpired && open) {
    setOpen(false);
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl bg-gradient-to-b from-white to-primary/5">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
              <Clock size={40} />
            </div>
          </div>
          <DialogTitle className="text-2xl font-black text-center text-foreground">Finalizar sua Reserva?</DialogTitle>
          <DialogDescription className="text-center text-base font-medium">
            Você iniciou uma pré-reserva via assistente. <br />
            Confirme agora para garantir sua data!
          </DialogDescription>
        </DialogHeader>

        <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 shadow-sm border border-primary/10 space-y-4 my-2">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Local</p>
              <p className="text-lg font-bold text-foreground">{preReserva.espacos?.nome || "Espaço"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Data e Horário</p>
              <p className="text-lg font-bold text-foreground">
                {new Date(preReserva.data + "T00:00:00").toLocaleDateString("pt-BR")}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                {preReserva.horario_inicio?.slice(0, 5)} - {preReserva.horario_fim?.slice(0, 5)}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 rounded-2xl border border-primary/10">
              <span className="text-sm font-black text-primary uppercase tracking-tighter">Expira em:</span>
              <span className="text-xl font-black text-primary font-mono">{formatTimeRemaining(preReserva.expira_em)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20" 
            onClick={handleConfirm}
            disabled={submitting}
          >
            <Check className="mr-2 h-5 w-5" /> Confirmar Agora
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-14 rounded-2xl font-black text-lg border-2" 
            onClick={handleCancel}
            disabled={submitting}
          >
            <X className="mr-2 h-5 w-5" /> Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

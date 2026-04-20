import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prestadorUserId: string;
  prestadorNome: string;
  condominioId: string;
  onSaved?: () => void;
}

const AvaliarPrestadorDialog = ({
  open,
  onOpenChange,
  prestadorUserId,
  prestadorNome,
  condominioId,
  onSaved,
}: Props) => {
  const { user } = useAuth();
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<{ id: string } | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("avaliacoes")
      .select("id, nota, comentario")
      .eq("avaliador_id", user.id)
      .eq("avaliado_id", prestadorUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExisting({ id: data.id });
          setNota(data.nota);
          setComentario(data.comentario || "");
        } else {
          setExisting(null);
          setNota(0);
          setComentario("");
        }
        setLoading(false);
      });
  }, [open, user, prestadorUserId]);

  const handleSubmit = async () => {
    if (!user || nota < 1) return;
    setSubmitting(true);

    const payload = {
      avaliador_id: user.id,
      avaliado_id: prestadorUserId,
      condominio_id: condominioId,
      nota,
      comentario: comentario.trim() || null,
    };

    const { error } = existing
      ? await supabase.from("avaliacoes").update(payload).eq("id", existing.id)
      : await supabase.from("avaliacoes").insert(payload);

    if (error) {
      toast.error("Erro ao enviar avaliação");
    } else {
      toast.success(existing ? "Avaliação atualizada!" : "Avaliação enviada!");
      onSaved?.();
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar {prestadorNome}</DialogTitle>
          <DialogDescription>
            {existing
              ? "Você já avaliou este prestador. Sua nova avaliação substituirá a anterior."
              : "Compartilhe sua experiência. Você só pode enviar uma avaliação por prestador."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center py-6 text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Nota</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNota(n)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      size={36}
                      className={n <= nota ? "text-warning fill-warning" : "text-muted-foreground"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Comentário (opcional)</label>
              <Textarea
                placeholder="Conte sua experiência..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleSubmit} disabled={submitting || nota < 1}>
              {submitting ? "Enviando..." : existing ? "Atualizar avaliação" : "Enviar avaliação"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AvaliarPrestadorDialog;

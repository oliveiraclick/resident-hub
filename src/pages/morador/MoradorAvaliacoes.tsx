import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star } from "lucide-react";

const MoradorAvaliacoes = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [prestadores, setPrestadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrestador, setSelectedPrestador] = useState<any>(null);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!condominioId) return;

    const fetchPrestadores = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("prestadores")
        .select("id, user_id, especialidade, descricao")
        .eq("condominio_id", condominioId);
      setPrestadores(data || []);
      setLoading(false);
    };

    fetchPrestadores();
  }, [condominioId]);

  const handleSubmit = async () => {
    if (!user || !condominioId || !selectedPrestador || nota < 1) return;
    setSubmitting(true);

    const { error } = await supabase.from("avaliacoes").insert({
      condominio_id: condominioId,
      avaliador_id: user.id,
      avaliado_id: selectedPrestador.user_id,
      nota,
      comentario: comentario.trim() || null,
    });

    if (error) {
      toast.error("Erro ao enviar avaliação");
    } else {
      toast.success("Avaliação enviada!");
      setSelectedPrestador(null);
      setNota(0);
      setComentario("");
    }
    setSubmitting(false);
  };

  if (selectedPrestador) {
    return (
      <MoradorLayout title="Avaliar" showBack>
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              <p className="text-title-md">{selectedPrestador.especialidade}</p>
              {selectedPrestador.descricao && (
                <p className="text-body text-muted-foreground">{selectedPrestador.descricao}</p>
              )}

              {/* Star rating */}
              <div>
                <label className="mb-2 block">Nota</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setNota(n)}
                      className="transition-transform active:scale-90"
                    >
                      <Star
                        size={32}
                        className={n <= nota ? "text-warning fill-warning" : "text-muted-foreground"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block">Comentário (opcional)</label>
                <Input
                  placeholder="Conte sua experiência..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
              </div>

              <Button onClick={handleSubmit} disabled={submitting || nota < 1}>
                {submitting ? "Enviando..." : "Enviar Avaliação"}
              </Button>
              <Button variant="outline" onClick={() => setSelectedPrestador(null)}>
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      </MoradorLayout>
    );
  }

  return (
    <MoradorLayout title="Avaliações" showBack>
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : prestadores.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Star size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhum prestador para avaliar</p>
          </div>
        ) : (
          prestadores.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => setSelectedPrestador(p)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-button bg-primary/10">
                  <Star size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-title-md">{p.especialidade}</p>
                  {p.descricao && (
                    <p className="text-subtitle text-muted-foreground truncate">{p.descricao}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorAvaliacoes;

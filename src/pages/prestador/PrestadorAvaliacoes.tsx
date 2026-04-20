import { useEffect, useState } from "react";
import PrestadorLayout from "@/components/PrestadorLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface Avaliacao {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  avaliador_id: string;
  avaliador_nome: string;
}

const PrestadorAvaliacoes = () => {
  const { user } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("avaliacoes")
        .select("id, nota, comentario, created_at, avaliador_id")
        .eq("avaliado_id", user.id)
        .order("created_at", { ascending: false });

      const ids = Array.from(new Set((data || []).map((a) => a.avaliador_id)));
      let nomes: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .rpc("get_evento_participant_profiles", { _user_ids: ids }) as {
            data: { user_id: string; nome: string }[] | null;
          };
        (profs || []).forEach((p) => { nomes[p.user_id] = p.nome; });
      }

      setAvaliacoes(
        (data || []).map((a) => ({
          ...a,
          avaliador_nome: nomes[a.avaliador_id] || "Morador",
        }))
      );
      setLoading(false);
    };
    fetch();
  }, [user]);

  const media = avaliacoes.length > 0
    ? avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length
    : null;

  return (
    <PrestadorLayout title="Minhas avaliações" showBack>
      <div className="flex flex-col gap-4">
        {media !== null && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star size={24} className="fill-yellow-500 text-yellow-500" />
              </div>
              <div>
                <p className="text-[24px] font-bold text-foreground leading-none">
                  {media.toFixed(1)}
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  {avaliacoes.length} avaliaç{avaliacoes.length === 1 ? "ão recebida" : "ões recebidas"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
        ) : avaliacoes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Star size={40} className="text-muted-foreground" />
            <p className="text-[14px] text-muted-foreground">
              Você ainda não recebeu avaliações
            </p>
          </div>
        ) : (
          avaliacoes.map((av) => (
            <Card key={av.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-[14px] font-semibold text-foreground truncate">
                    {av.avaliador_nome}
                  </p>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < av.nota ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}
                      />
                    ))}
                  </div>
                </div>
                {av.comentario && (
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    "{av.comentario}"
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">
                  {new Date(av.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorAvaliacoes;

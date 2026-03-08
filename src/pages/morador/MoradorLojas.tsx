import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Store } from "lucide-react";

const MoradorLojas = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [lojas, setLojas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!condominioId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("lojas")
        .select("id, nome, descricao, banner_url, horario_funcionamento")
        .eq("condominio_id", condominioId)
        .eq("ativa", true)
        .order("created_at", { ascending: false });
      setLojas(data || []);
      setLoading(false);
    })();
  }, [condominioId]);

  return (
    <MoradorLayout title="Lojas" showBack>
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : lojas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Store size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhuma loja disponível</p>
          </div>
        ) : (
          lojas.map(l => (
            <button
              key={l.id}
              onClick={() => navigate(`/morador/lojas/${l.id}`)}
              className="bg-transparent border-none cursor-pointer p-0 text-left active:scale-[0.98] transition-transform w-full"
            >
              <Card className="overflow-hidden">
                {l.banner_url && (
                  <img src={l.banner_url} alt={l.nome} className="w-full h-28 object-cover" />
                )}
                <CardContent className="flex items-center gap-3 p-3">
                  <Store size={20} className="text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{l.nome}</p>
                    {l.descricao && (
                      <p className="text-[12px] text-muted-foreground truncate">{l.descricao}</p>
                    )}
                    {l.horario_funcionamento && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{l.horario_funcionamento}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorLojas;

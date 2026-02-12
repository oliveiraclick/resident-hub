import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, CheckCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  RECEBIDO: "bg-primary/10 text-primary",
  AGUARDANDO_RETIRADA: "bg-warning/20 text-foreground",
  EM_CONFIRMACAO: "bg-primary/20 text-primary",
  RETIRADO: "bg-success/10 text-success",
};

const MoradorEncomendas = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [pacotes, setPacotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPacotes = async () => {
    if (!condominioId || !user) return;
    setLoading(true);

    const { data } = await (supabase
      .from("pacotes")
      .select("*") as any)
      .eq("condominio_id", condominioId)
      .eq("morador_id", user.id)
      .order("created_at", { ascending: false });

    setPacotes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPacotes();
  }, [condominioId, user]);

  const handleConfirmar = async (pacoteId: string) => {
    const { error } = await supabase
      .from("pacotes")
      .update({
        status: "EM_CONFIRMACAO",
      } as any)
      .eq("id", pacoteId);

    if (error) {
      toast.error("Erro ao confirmar");
      return;
    }
    toast.success("Confirmação enviada!");
    fetchPacotes();
  };

  return (
    <MoradorLayout title="Minhas Encomendas">
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : pacotes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Package size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhuma encomenda</p>
          </div>
        ) : (
          pacotes.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-body font-medium">{p.descricao}</p>
                    <p className="text-label text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span
                    className={`rounded-button px-2 py-1 text-label ${statusColors[p.status] || ""}`}
                  >
                    {p.status?.replace(/_/g, " ")}
                  </span>
                </div>

                {p.status === "AGUARDANDO_RETIRADA" && (
                  <Button size="sm" onClick={() => handleConfirmar(p.id)}>
                    <CheckCircle size={16} />
                    Confirmar Retirada
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorEncomendas;

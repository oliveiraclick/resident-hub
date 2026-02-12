import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import QrDisplay from "@/components/QrDisplay";
import { Package } from "lucide-react";

const statusColors: Record<string, string> = {
  RECEBIDO: "bg-primary/10 text-primary",
  AGUARDANDO_RETIRADA: "bg-warning/20 text-foreground",
  EM_CONFIRMACAO: "bg-primary/20 text-primary",
  RETIRADO: "bg-success/10 text-success",
};

const Historico = () => {
  const { roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [pacotes, setPacotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [selectedPacote, setSelectedPacote] = useState<any>(null);

  useEffect(() => {
    if (!condominioId) return;

    const fetchPacotes = async () => {
      setLoading(true);
      let query = supabase
        .from("pacotes")
        .select("*")
        .eq("condominio_id", condominioId)
        .order("created_at", { ascending: false });

      if (filtroStatus !== "todos") {
        query = query.eq("status", filtroStatus);
      }

      const { data } = await query;
      setPacotes(data || []);
      setLoading(false);
    };

    fetchPacotes();
  }, [condominioId, filtroStatus]);

  const statusOptions = ["todos", "RECEBIDO", "AGUARDANDO_RETIRADA", "EM_CONFIRMACAO", "RETIRADO"];

  return (
    <AdminLayout title="Histórico">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`whitespace-nowrap rounded-button px-3 py-2 text-label transition-colors ${
                filtroStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s === "todos" ? "Todos" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-body text-muted-foreground text-center py-8">
            Carregando...
          </p>
        )}

        {!loading && pacotes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Package size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhum pacote encontrado</p>
          </div>
        )}

        {/* Detalhes do pacote selecionado */}
        {selectedPacote && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <p className="text-title-md">Detalhes do Pacote</p>
              <p className="text-body text-muted-foreground">{selectedPacote.descricao}</p>
              <div className="flex items-center gap-2">
                <span className="text-label">Status:</span>
                <span className={`rounded-button px-2 py-1 text-label ${statusColors[selectedPacote.status] || ""}`}>
                  {selectedPacote.status?.replace(/_/g, " ")}
                </span>
              </div>
              {(selectedPacote as any).qr_code && (
                <QrDisplay value={(selectedPacote as any).qr_code} label="QR do pacote" size={140} />
              )}
              <Button variant="outline" onClick={() => setSelectedPacote(null)}>
                Fechar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista */}
        {!selectedPacote &&
          pacotes.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => setSelectedPacote(p)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-button bg-primary/10">
                  <Package size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium truncate">{p.descricao}</p>
                  <p className="text-label text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className={`rounded-button px-2 py-1 text-label ${statusColors[p.status] || ""}`}>
                  {p.status?.replace(/_/g, " ")}
                </span>
              </CardContent>
            </Card>
          ))}
      </div>
    </AdminLayout>
  );
};

export default Historico;

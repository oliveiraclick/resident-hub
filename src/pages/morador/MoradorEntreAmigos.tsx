import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Users, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  created_at: string;
  criador_id: string;
  participantes_count?: number;
  total_despesas?: number;
}

const MoradorEntreAmigos = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const condominioId = roles.find((r) => r.role === "morador")?.condominio_id;

  useEffect(() => {
    if (!user) return;
    fetchEventos();
  }, [user]);

  const fetchEventos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("eventos_amigos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Enrich with counts
    const enriched = await Promise.all(
      (data || []).map(async (ev: any) => {
        const [partRes, despRes] = await Promise.all([
          supabase.from("evento_participantes").select("id", { count: "exact", head: true }).eq("evento_id", ev.id),
          supabase.from("evento_despesas").select("valor").eq("evento_id", ev.id),
        ]);
        return {
          ...ev,
          participantes_count: (partRes.count || 0) + 1, // +1 for creator
          total_despesas: (despRes.data || []).reduce((sum: number, d: any) => sum + Number(d.valor), 0),
        };
      })
    );

    setEventos(enriched);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !condominioId) return;
    const trimmed = titulo.trim();
    if (trimmed.length < 2) {
      toast.error("Dê um nome ao evento");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("eventos_amigos").insert({
      titulo: trimmed,
      descricao: descricao.trim() || null,
      condominio_id: condominioId,
      criador_id: user.id,
    } as any);

    if (error) {
      toast.error("Erro ao criar evento");
      console.error(error);
    } else {
      toast.success("Evento criado!");
      setTitulo("");
      setDescricao("");
      setDialogOpen(false);
      fetchEventos();
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <MoradorLayout title="Entre Amigos" showBack>
      <div className="flex flex-col gap-4 max-w-md mx-auto pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Crie eventos, convide vizinhos e divida as despesas facilmente.
          </p>
        </div>

        {/* Create button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus size={16} /> Novo evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar evento</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Nome do evento (ex: Churrascão)"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={100}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* List */}
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : eventos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8">
              <Users size={40} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum evento ainda</p>
              <p className="text-xs text-muted-foreground">Crie um evento e convide seus vizinhos!</p>
            </CardContent>
          </Card>
        ) : (
          eventos.map((ev) => (
            <Card
              key={ev.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/morador/entre-amigos/${ev.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{ev.titulo}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          ev.status === "ativo"
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ev.status === "ativo" ? "Ativo" : "Encerrado"}
                      </span>
                    </div>
                    {ev.descricao && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.descricao}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {ev.participantes_count} pessoas
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        {format(new Date(ev.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      R$ {(ev.total_despesas || 0).toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorEntreAmigos;

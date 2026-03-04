import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Users, CalendarDays, PartyPopper, ChevronRight, Sparkles } from "lucide-react";
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

    const enriched = await Promise.all(
      (data || []).map(async (ev: any) => {
        const [partRes, despRes] = await Promise.all([
          supabase.from("evento_participantes").select("id", { count: "exact", head: true }).eq("evento_id", ev.id),
          supabase.from("evento_despesas").select("valor").eq("evento_id", ev.id),
        ]);
        return {
          ...ev,
          participantes_count: (partRes.count || 0) + 1,
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
      <div className="flex flex-col gap-5 max-w-md mx-auto pb-6">
        {/* Hero banner */}
        <div
          className="relative overflow-hidden rounded-[var(--radius-card)] p-5 animate-fade-in"
          style={{
            background: "linear-gradient(135deg, hsl(var(--header-bg)), hsl(var(--header-mid)), hsl(var(--primary) / 0.85))",
          }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-primary/15 blur-xl" />
          <div className="relative z-10 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 backdrop-blur-sm">
              <PartyPopper size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-primary-foreground font-bold text-base">
                Resenha com a galera! 🎉
              </h2>
              <p className="text-primary-foreground/70 text-xs mt-1 leading-relaxed">
                Crie um evento, convide vizinhos e divida as despesas de forma justa e automática.
              </p>
            </div>
          </div>
          {/* Wave decoration */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 400 30" preserveAspectRatio="none">
            <path d="M0,30 L0,15 Q100,0 200,15 Q300,30 400,15 L400,30 Z" fill="hsl(var(--background) / 0.08)" />
          </svg>
        </div>

        {/* Create button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 text-base gap-3 shadow-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-foreground/20">
                <Plus size={18} />
              </div>
              Criar novo evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary" /> Novo evento
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Nome do evento (ex: Churrascão do Bloco A)"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={100}
              />
              <Textarea
                placeholder="Descrição (opcional) — conte o que vai rolar!"
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
                {saving ? "Criando..." : "Criar evento 🎉"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando eventos...</p>
          </div>
        ) : eventos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div
              className="flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))",
              }}
            >
              <Users size={36} className="text-primary/50" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Nenhum evento ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Junte a galera, crie um evento e divida tudo certinho! 💸
              </p>
            </div>
          </div>
        ) : (
          eventos.map((ev, idx) => (
            <Card
              key={ev.id}
              className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden animate-fade-in border-none shadow-md"
              style={{ animationDelay: `${0.1 * (idx + 1)}s` }}
              onClick={() => navigate(`/morador/entre-amigos/${ev.id}`)}
            >
              <CardContent className="p-0">
                {/* Color accent bar */}
                <div
                  className="h-1.5 w-full"
                  style={{
                    background: ev.status === "ativo"
                      ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-light)))"
                      : "hsl(var(--muted))",
                  }}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                        style={{
                          background: ev.status === "ativo"
                            ? "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))"
                            : "hsl(var(--muted))",
                        }}
                      >
                        {ev.status === "ativo" ? "🎊" : "✅"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground truncate">{ev.titulo}</p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                              ev.status === "ativo"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {ev.status === "ativo" ? "Ativo" : "Encerrado"}
                          </span>
                        </div>
                        {ev.descricao && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ev.descricao}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users size={11} /> {ev.participantes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays size={11} />
                            {format(new Date(ev.created_at), "dd MMM", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
                          R$ {(ev.total_despesas || 0).toFixed(2).replace(".", ",")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">total</p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground/50" />
                    </div>
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

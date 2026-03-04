import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, UserPlus, Trash2, Camera, Receipt, Users, CheckCircle2, XCircle, Clock,
  ArrowUpRight, ArrowDownLeft, Image, PartyPopper, Sparkles, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  criador_id: string;
  condominio_id: string;
}

interface Participante {
  id: string;
  user_id: string;
  status: string;
  nome?: string;
  avatar_url?: string;
}

interface Despesa {
  id: string;
  pagador_id: string;
  valor: number;
  descricao: string | null;
  recibo_url: string | null;
  created_at: string;
  pagador_nome?: string;
}

interface Morador {
  user_id: string;
  nome: string;
  avatar_url: string | null;
}

interface Saldo {
  user_id: string;
  nome: string;
  pagou: number;
  deve: number;
  saldo: number;
}

const MoradorEntreAmigosDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const { user, roles } = useAuth();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expValor, setExpValor] = useState("");
  const [expDescricao, setExpDescricao] = useState("");
  const [expRecibo, setExpRecibo] = useState<File | null>(null);
  const [expSaving, setExpSaving] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);

  const condominioId = roles.find((r) => r.role === "morador")?.condominio_id;
  const isCreator = evento?.criador_id === user?.id;
  const myParticipation = participantes.find((p) => p.user_id === user?.id);
  const isParticipant = isCreator || myParticipation?.status === "aceito";

  useEffect(() => {
    if (!id || !user) return;
    fetchAll();
  }, [id, user]);

  const fetchAll = async () => {
    setLoading(true);
    const { data: ev } = await supabase
      .from("eventos_amigos")
      .select("*")
      .eq("id", id!)
      .maybeSingle();

    if (!ev) {
      toast.error("Evento não encontrado");
      navigate("/morador/entre-amigos");
      return;
    }
    setEvento(ev as any);

    const [partRes, despRes] = await Promise.all([
      supabase.from("evento_participantes").select("*").eq("evento_id", id!),
      supabase.from("evento_despesas").select("*").eq("evento_id", id!).order("created_at", { ascending: false }),
    ]);

    const parts = partRes.data || [];
    const desps = despRes.data || [];

    const allUserIds = [
      ev.criador_id,
      ...parts.map((p: any) => p.user_id),
      ...desps.map((d: any) => d.pagador_id),
    ].filter((v, i, a) => a.indexOf(v) === i);

    const { data: profiles } = await supabase.rpc("get_evento_participant_profiles", {
      _user_ids: allUserIds,
    });

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    setParticipantes(
      parts.map((p: any) => ({
        ...p,
        nome: profileMap.get(p.user_id)?.nome || "Morador",
        avatar_url: profileMap.get(p.user_id)?.avatar_url,
      }))
    );

    setDespesas(
      desps.map((d: any) => ({
        ...d,
        pagador_nome: profileMap.get(d.pagador_id)?.nome || "Morador",
      }))
    );

    setLoading(false);
  };

  const saldos = useMemo(() => {
    if (!evento) return [];
    const aceitos = participantes.filter((p) => p.status === "aceito");
    const allMembers = [
      { user_id: evento.criador_id, nome: "Você (criador)" },
      ...aceitos.map((p) => ({ user_id: p.user_id, nome: p.nome || "Morador" })),
    ];

    const totalGasto = despesas.reduce((s, d) => s + Number(d.valor), 0);
    const perPerson = allMembers.length > 0 ? totalGasto / allMembers.length : 0;

    return allMembers.map((m) => {
      const pagou = despesas
        .filter((d) => d.pagador_id === m.user_id)
        .reduce((s, d) => s + Number(d.valor), 0);
      return {
        user_id: m.user_id,
        nome: m.user_id === user?.id ? "Você" : m.nome,
        pagou,
        deve: perPerson,
        saldo: pagou - perPerson,
      };
    });
  }, [evento, participantes, despesas, user]);

  const totalGasto = despesas.reduce((s, d) => s + Number(d.valor), 0);
  const numPessoas = saldos.length;

  const openInvite = async () => {
    if (!condominioId) return;
    setInviteOpen(true);
    const { data } = await supabase.rpc("get_condominio_moradores", {
      _condominio_id: condominioId,
    });
    setMoradores((data || []) as Morador[]);
  };

  const handleInvite = async (moradorId: string) => {
    setInviting(moradorId);
    const { error } = await supabase.from("evento_participantes").insert({
      evento_id: id!,
      user_id: moradorId,
    } as any);
    if (error) {
      if (error.code === "23505") toast.info("Já convidado");
      else toast.error("Erro ao convidar");
    } else {
      toast.success("Convite enviado!");
      fetchAll();
    }
    setInviting(null);
  };

  const handleRespond = async (status: "aceito" | "recusado") => {
    if (!myParticipation) return;
    const { error } = await supabase
      .from("evento_participantes")
      .update({ status } as any)
      .eq("id", myParticipation.id);
    if (error) toast.error("Erro");
    else {
      toast.success(status === "aceito" ? "Convite aceito!" : "Convite recusado");
      fetchAll();
    }
  };

  const handleAddExpense = async () => {
    if (!user) return;
    const valor = parseFloat(expValor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      toast.error("Valor inválido");
      return;
    }
    if (!expDescricao.trim()) {
      toast.error("Descreva a despesa");
      return;
    }

    setExpSaving(true);
    let reciboUrl: string | null = null;

    if (expRecibo) {
      const ext = expRecibo.name.split(".").pop();
      const path = `${user.id}/${id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("recibos").upload(path, expRecibo);
      if (upErr) {
        toast.error("Erro ao enviar recibo");
        setExpSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("recibos").getPublicUrl(path);
      reciboUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("evento_despesas").insert({
      evento_id: id!,
      pagador_id: user.id,
      valor,
      descricao: expDescricao.trim(),
      recibo_url: reciboUrl,
    } as any);

    if (error) {
      toast.error("Erro ao registrar despesa");
    } else {
      toast.success("Despesa registrada!");
      setExpValor("");
      setExpDescricao("");
      setExpRecibo(null);
      setExpenseOpen(false);
      fetchAll();
    }
    setExpSaving(false);
  };

  const handleDeleteExpense = async (expId: string) => {
    const { error } = await supabase.from("evento_despesas").delete().eq("id", expId);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Despesa excluída");
      fetchAll();
    }
  };

  const handleCloseEvent = async () => {
    const { error } = await supabase
      .from("eventos_amigos")
      .update({ status: "encerrado" } as any)
      .eq("id", id!);
    if (error) toast.error("Erro");
    else {
      toast.success("Evento encerrado!");
      fetchAll();
    }
  };

  if (loading) {
    return (
      <MoradorLayout title="Entre Amigos" showBack>
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando evento...</p>
        </div>
      </MoradorLayout>
    );
  }

  if (!evento) return null;

  const filteredMoradores = moradores.filter(
    (m) =>
      !participantes.some((p) => p.user_id === m.user_id) &&
      m.user_id !== evento.criador_id &&
      m.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MoradorLayout title={evento.titulo} showBack>
      <div className="flex flex-col gap-4 max-w-md mx-auto pb-6">
        {/* Pending invite banner */}
        {myParticipation?.status === "pendente" && (
          <div
            className="rounded-[var(--radius-card)] p-4 animate-fade-in"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))",
              border: "2px solid hsl(var(--primary) / 0.3)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper size={18} className="text-primary" />
              <p className="text-sm font-bold text-foreground">Você foi convidado! 🎉</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleRespond("aceito")} className="flex-1">
                <CheckCircle2 size={14} /> Aceitar
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRespond("recusado")} className="flex-1">
                <XCircle size={14} /> Recusar
              </Button>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 animate-fade-in">
          <div
            className="rounded-2xl p-3 text-center"
            style={{
              background: "linear-gradient(135deg, hsl(var(--header-bg)), hsl(var(--primary) / 0.8))",
            }}
          >
            <p className="text-lg font-bold text-primary-foreground">
              R$ {totalGasto.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[10px] text-primary-foreground/60 font-medium">Total gasto</p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-card shadow-sm border border-border">
            <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
              <Users size={16} className="text-primary" /> {numPessoas}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">Pessoas</p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-card shadow-sm border border-border">
            <p className="text-lg font-bold text-primary">
              R$ {numPessoas > 0 ? (totalGasto / numPessoas).toFixed(2).replace(".", ",") : "0,00"}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">Por pessoa</p>
          </div>
        </div>

        <Tabs defaultValue="saldos" className="w-full animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl bg-muted p-1">
            <TabsTrigger value="saldos" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs font-semibold">
              💰 Saldos
            </TabsTrigger>
            <TabsTrigger value="despesas" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs font-semibold">
              🧾 Despesas
            </TabsTrigger>
            <TabsTrigger value="pessoas" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs font-semibold">
              👥 Pessoas
            </TabsTrigger>
          </TabsList>

          {/* Saldos tab */}
          <TabsContent value="saldos" className="flex flex-col gap-2 mt-3">
            {saldos.length === 0 ? (
              <EmptyState icon="💰" text="Convide pessoas para ver os saldos" />
            ) : (
              saldos.map((s, idx) => {
                const isPositive = s.saldo > 0.01;
                const isNegative = s.saldo < -0.01;
                return (
                  <Card
                    key={s.user_id}
                    className="border-none shadow-sm overflow-hidden animate-fade-in"
                    style={{ animationDelay: `${0.05 * idx}s` }}
                  >
                    <CardContent className="p-0">
                      <div
                        className="h-1 w-full"
                        style={{
                          background: isPositive
                            ? "hsl(var(--success))"
                            : isNegative
                            ? "hsl(var(--destructive))"
                            : "hsl(var(--muted))",
                        }}
                      />
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
                            style={{
                              background: isPositive
                                ? "hsl(var(--success) / 0.1)"
                                : isNegative
                                ? "hsl(var(--destructive) / 0.1)"
                                : "hsl(var(--muted))",
                              color: isPositive
                                ? "hsl(var(--success))"
                                : isNegative
                                ? "hsl(var(--destructive))"
                                : "hsl(var(--muted-foreground))",
                            }}
                          >
                            {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : <Minus size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{s.nome}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Pagou R$ {s.pagou.toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                        </div>
                        <p
                          className="text-sm font-bold"
                          style={{
                            color: isPositive
                              ? "hsl(var(--success))"
                              : isNegative
                              ? "hsl(var(--destructive))"
                              : "hsl(var(--muted-foreground))",
                          }}
                        >
                          {isPositive
                            ? `+R$ ${s.saldo.toFixed(2).replace(".", ",")}`
                            : isNegative
                            ? `-R$ ${Math.abs(s.saldo).toFixed(2).replace(".", ",")}`
                            : "Zerado ✅"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Despesas tab */}
          <TabsContent value="despesas" className="flex flex-col gap-2 mt-3">
            {isParticipant && evento.status === "ativo" && (
              <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full gap-2">
                    <Receipt size={14} /> Registrar despesa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" /> Nova despesa
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3">
                    <Input
                      placeholder="O que comprou? (ex: Carne, Bebidas)"
                      value={expDescricao}
                      onChange={(e) => setExpDescricao(e.target.value)}
                      maxLength={200}
                    />
                    <Input
                      placeholder="Valor (ex: 150,00)"
                      value={expValor}
                      onChange={(e) => setExpValor(e.target.value)}
                      inputMode="decimal"
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Camera size={14} /> Foto do recibo (opcional)
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => setExpRecibo(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleAddExpense} disabled={expSaving}>
                      {expSaving ? "Salvando..." : "Registrar 💸"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {despesas.length === 0 ? (
              <EmptyState icon="🧾" text="Nenhuma despesa registrada ainda" />
            ) : (
              despesas.map((d, idx) => (
                <Card
                  key={d.id}
                  className="border-none shadow-sm animate-fade-in"
                  style={{ animationDelay: `${0.05 * idx}s` }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm"
                          style={{ background: "hsl(var(--primary) / 0.1)" }}
                        >
                          🛒
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{d.descricao}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {d.pagador_id === user?.id ? "Você" : d.pagador_nome} • {new Date(d.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-sm font-bold text-primary">
                          R$ {Number(d.valor).toFixed(2).replace(".", ",")}
                        </p>
                        {d.recibo_url && (
                          <a href={d.recibo_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                            <Image size={16} className="text-muted-foreground" />
                          </a>
                        )}
                        {d.pagador_id === user?.id && (
                          <button onClick={() => handleDeleteExpense(d.id)} className="hover:opacity-70 transition-opacity">
                            <Trash2 size={14} className="text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Pessoas tab */}
          <TabsContent value="pessoas" className="flex flex-col gap-2 mt-3">
            {isCreator && evento.status === "ativo" && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full gap-2" onClick={openInvite}>
                    <UserPlus size={14} /> Convidar vizinhos
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus size={16} className="text-primary" /> Convidar moradores
                    </DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                    {filteredMoradores.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum morador disponível
                      </p>
                    ) : (
                      filteredMoradores.map((m) => (
                        <div key={m.user_id} className="flex items-center justify-between p-2.5 rounded-xl border border-border">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-primary"
                              style={{ background: "hsl(var(--primary) / 0.1)" }}
                            >
                              {m.nome?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <p className="text-sm font-medium">{m.nome}</p>
                          </div>
                          <Button
                            size="sm"
                            disabled={inviting === m.user_id}
                            onClick={() => handleInvite(m.user_id)}
                          >
                            {inviting === m.user_id ? "..." : "Convidar"}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Creator */}
            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="h-1 w-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-light)))" }}
                />
                <div className="p-3 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}
                  >
                    👑
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {evento.criador_id === user?.id ? "Você" : "Criador"}
                    </p>
                    <p className="text-[10px] text-primary font-medium">Organizador</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            {participantes.map((p, idx) => {
              const statusConfig = {
                aceito: { icon: <CheckCircle2 size={14} />, label: "Aceito", color: "hsl(var(--success))" },
                recusado: { icon: <XCircle size={14} />, label: "Recusou", color: "hsl(var(--destructive))" },
                pendente: { icon: <Clock size={14} />, label: "Pendente", color: "hsl(var(--warning))" },
              }[p.status] || { icon: <Clock size={14} />, label: p.status, color: "hsl(var(--muted-foreground))" };

              return (
                <Card
                  key={p.id}
                  className="border-none shadow-sm animate-fade-in"
                  style={{ animationDelay: `${0.05 * (idx + 1)}s` }}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                        {p.nome?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {p.user_id === user?.id ? "Você" : p.nome}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: statusConfig.color }}>
                      {statusConfig.icon} {statusConfig.label}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Close event */}
        {isCreator && evento.status === "ativo" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive mt-2">
                Encerrar evento
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Encerrar evento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Após encerrar, ninguém poderá adicionar novas despesas. Os saldos finais ficam registrados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCloseEvent}>Encerrar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </MoradorLayout>
  );
};

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex flex-col items-center gap-3 py-8">
    <div
      className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
      style={{ background: "hsl(var(--primary) / 0.08)" }}
    >
      {icon}
    </div>
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default MoradorEntreAmigosDetalhe;

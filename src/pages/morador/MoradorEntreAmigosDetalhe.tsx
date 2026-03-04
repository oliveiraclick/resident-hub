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
  ArrowUpRight, ArrowDownLeft, Image,
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

  // Add expense dialog
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expValor, setExpValor] = useState("");
  const [expDescricao, setExpDescricao] = useState("");
  const [expRecibo, setExpRecibo] = useState<File | null>(null);
  const [expSaving, setExpSaving] = useState(false);

  // Invite dialog
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

    // Fetch participants and expenses in parallel
    const [partRes, despRes] = await Promise.all([
      supabase.from("evento_participantes").select("*").eq("evento_id", id!),
      supabase.from("evento_despesas").select("*").eq("evento_id", id!).order("created_at", { ascending: false }),
    ]);

    const parts = partRes.data || [];
    const desps = despRes.data || [];

    // Get all user_ids for profile lookup
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

  // Calculate balances
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

  // Invite moradores
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

  // Accept/decline invite
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

  // Add expense
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
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
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
          <Card className="border-primary">
            <CardContent className="p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">Você foi convidado!</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleRespond("aceito")} className="flex-1">
                  <CheckCircle2 size={14} /> Aceitar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRespond("recusado")} className="flex-1">
                  <XCircle size={14} /> Recusar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-primary">
                R$ {totalGasto.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-[10px] text-muted-foreground">Total gasto</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{numPessoas}</p>
              <p className="text-[10px] text-muted-foreground">Pessoas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                R$ {numPessoas > 0 ? (totalGasto / numPessoas).toFixed(2).replace(".", ",") : "0,00"}
              </p>
              <p className="text-[10px] text-muted-foreground">Por pessoa</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="saldos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="saldos">Saldos</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
            <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
          </TabsList>

          {/* Saldos tab */}
          <TabsContent value="saldos" className="flex flex-col gap-2 mt-2">
            {saldos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum participante ainda</p>
            ) : (
              saldos.map((s) => (
                <Card key={s.user_id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.nome}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Pagou R$ {s.pagou.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {s.saldo > 0.01 ? (
                          <ArrowDownLeft size={14} className="text-green-600" />
                        ) : s.saldo < -0.01 ? (
                          <ArrowUpRight size={14} className="text-red-500" />
                        ) : null}
                        <p
                          className={`text-sm font-bold ${
                            s.saldo > 0.01
                              ? "text-green-600"
                              : s.saldo < -0.01
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {s.saldo > 0.01
                            ? `Recebe R$ ${s.saldo.toFixed(2).replace(".", ",")}`
                            : s.saldo < -0.01
                            ? `Deve R$ ${Math.abs(s.saldo).toFixed(2).replace(".", ",")}`
                            : "Zerado"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Despesas tab */}
          <TabsContent value="despesas" className="flex flex-col gap-2 mt-2">
            {isParticipant && evento.status === "ativo" && (
              <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full">
                    <Plus size={14} /> Adicionar despesa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova despesa</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3">
                    <Input
                      placeholder="Descrição (ex: Carne)"
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
                      {expSaving ? "Salvando..." : "Registrar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {despesas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa registrada</p>
            ) : (
              despesas.map((d) => (
                <Card key={d.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{d.descricao}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {d.pagador_nome} •{" "}
                          {new Date(d.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-primary">
                          R$ {Number(d.valor).toFixed(2).replace(".", ",")}
                        </p>
                        {d.recibo_url && (
                          <a href={d.recibo_url} target="_blank" rel="noopener noreferrer">
                            <Image size={16} className="text-muted-foreground" />
                          </a>
                        )}
                        {d.pagador_id === user?.id && (
                          <button onClick={() => handleDeleteExpense(d.id)}>
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
          <TabsContent value="pessoas" className="flex flex-col gap-2 mt-2">
            {isCreator && evento.status === "ativo" && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full" onClick={openInvite}>
                    <UserPlus size={14} /> Convidar morador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convidar moradores</DialogTitle>
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
                        <div key={m.user_id} className="flex items-center justify-between p-2 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {m.nome?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <p className="text-sm">{m.nome}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
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
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  👑
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {evento.criador_id === user?.id ? "Você" : "Criador"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Organizador</p>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            {participantes.map((p) => {
              const statusIcon =
                p.status === "aceito" ? (
                  <CheckCircle2 size={14} className="text-green-600" />
                ) : p.status === "recusado" ? (
                  <XCircle size={14} className="text-red-500" />
                ) : (
                  <Clock size={14} className="text-amber-500" />
                );
              const statusLabel =
                p.status === "aceito" ? "Aceito" : p.status === "recusado" ? "Recusou" : "Pendente";

              return (
                <Card key={p.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                        {p.nome?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {p.user_id === user?.id ? "Você" : p.nome}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {statusIcon} {statusLabel}
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
              <Button variant="outline" className="text-destructive border-destructive">
                Encerrar evento
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Encerrar evento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Após encerrar, ninguém poderá adicionar novas despesas. Os saldos finais serão
                  calculados automaticamente.
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

export default MoradorEntreAmigosDetalhe;

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBRL } from "@/lib/utils";
import {
  Plus, UserPlus, Trash2, Camera, Receipt, Users, CheckCircle2, XCircle, Clock,
  Image, PartyPopper, Sparkles, TrendingUp, TrendingDown, Minus, Copy, Send, Ban, Search,
} from "lucide-react";
import CotacaoDialog from "@/components/CotacaoDialog";
import CotacaoRespostasView from "@/components/CotacaoRespostasView";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  criador_id: string;
  condominio_id: string;
  pix_chave: string | null;
  pix_tipo: string | null;
  imagem_url: string | null;
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

interface Pagamento {
  id: string;
  pagador_id: string;
  recebedor_id: string;
  valor: number;
  comprovante_url: string | null;
  status: string;
  created_at: string;
}

interface ItemEvento {
  id: string;
  evento_id: string;
  nome: string;
  valor_estimado: number;
  responsavel_id: string | null;
  created_at: string;
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

// ── Component ──────────────────────────────────────────

const MoradorEntreAmigosDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const { user, roles } = useAuth();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [itens, setItens] = useState<ItemEvento[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  // Item dialog
  const [itemOpen, setItemOpen] = useState(false);
  const [itemNome, setItemNome] = useState("");
  const [itemValor, setItemValor] = useState("");
  const [itemSaving, setItemSaving] = useState(false);

  // Provider search inside item dialog
  const [itemPrestadores, setItemPrestadores] = useState<Array<{
    id: string; especialidade: string; user_id: string;
    nome: string; avatar_url: string | null;
  }>>([]);
  const [itemSearching, setItemSearching] = useState(false);
  const itemSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cover image
  const [coverUploading, setCoverUploading] = useState(false);

  // Expense dialog
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expValor, setExpValor] = useState("");
  const [expDescricao, setExpDescricao] = useState("");
  const [expRecibo, setExpRecibo] = useState<File | null>(null);
  const [expSaving, setExpSaving] = useState(false);
  const [expItemId, setExpItemId] = useState<string>("");

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);

  // PIX config dialog
  const [pixOpen, setPixOpen] = useState(false);
  const [pixChave, setPixChave] = useState("");
  const [pixTipo, setPixTipo] = useState("cpf");
  const [pixSaving, setPixSaving] = useState(false);

  // Payment dialog
  const [payOpen, setPayOpen] = useState(false);
  const [payFile, setPayFile] = useState<File | null>(null);
  const [paySaving, setPaySaving] = useState(false);
  const [payTarget, setPayTarget] = useState<{ userId: string; valor: number } | null>(null);

  // Cotação dialog
  const [cotacaoOpen, setCotacaoOpen] = useState(false);
  const [cotacaoCategoria, setCotacaoCategoria] = useState("");

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
    setPixChave((ev as any).pix_chave || "");
    setPixTipo((ev as any).pix_tipo || "cpf");

    const [partRes, despRes, pagRes, itensRes] = await Promise.all([
      supabase.from("evento_participantes").select("*").eq("evento_id", id!),
      supabase.from("evento_despesas").select("*").eq("evento_id", id!).order("created_at", { ascending: false }),
      supabase.from("evento_pagamentos").select("*").eq("evento_id", id!).order("created_at", { ascending: false }),
      supabase.from("evento_itens").select("*").eq("evento_id", id!).order("created_at", { ascending: true }),
    ]);

    const parts = partRes.data || [];
    const desps = despRes.data || [];
    const pags = pagRes.data || [];

    const allUserIds = [
      ev.criador_id,
      ...parts.map((p: any) => p.user_id),
      ...desps.map((d: any) => d.pagador_id),
      ...pags.map((p: any) => p.pagador_id),
      ...pags.map((p: any) => p.recebedor_id),
    ].filter((v, i, a) => a.indexOf(v) === i);

    const { data: profiles } = await supabase.rpc("get_evento_participant_profiles", {
      _user_ids: allUserIds,
    });

    const pMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    setProfileMap(pMap);

    setParticipantes(
      parts.map((p: any) => ({
        ...p,
        nome: pMap.get(p.user_id)?.nome || "Morador",
        avatar_url: pMap.get(p.user_id)?.avatar_url,
      }))
    );

    setDespesas(
      desps.map((d: any) => ({
        ...d,
        pagador_nome: pMap.get(d.pagador_id)?.nome || "Morador",
      }))
    );

    setPagamentos(pags as any[]);
    setItens((itensRes.data || []) as any[]);
    setLoading(false);
  };

  // ── Item provider search (AI-powered semantic matching) ──
  const searchItemPrestadores = async (term: string) => {
    if (!condominioId || term.trim().length < 2) {
      setItemPrestadores([]);
      return;
    }
    setItemSearching(true);
    try {
      // First try AI semantic match via edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke("match-categorias", {
        body: { termo: term.trim(), condominio_id: condominioId },
      });

      if (!fnError && fnData?.prestadores?.length > 0) {
        setItemPrestadores(fnData.prestadores);
        setItemSearching(false);
        return;
      }

      // Fallback: direct text search (unaccent)
      const { data: presData } = await supabase.rpc("search_prestadores_by_especialidade" as any, {
        _condominio_id: condominioId,
        _term: term.trim(),
      });

      if (presData && (presData as any[]).length > 0) {
        const uids = (presData as any[]).map((p: any) => p.user_id);
        const { data: profiles } = await supabase.rpc("get_prestador_profiles", { _user_ids: uids });
        const pMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        setItemPrestadores((presData as any[]).map((p: any) => ({
          id: p.id,
          especialidade: p.especialidade,
          user_id: p.user_id,
          nome: pMap.get(p.user_id)?.nome || "Prestador",
          avatar_url: pMap.get(p.user_id)?.avatar_url || null,
        })));
      } else {
        setItemPrestadores([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setItemPrestadores([]);
    }
    setItemSearching(false);
  };

  const handleItemNomeChange = (val: string) => {
    setItemNome(val);
    if (itemSearchTimer.current) clearTimeout(itemSearchTimer.current);
    itemSearchTimer.current = setTimeout(() => searchItemPrestadores(val), 600);
  };

  // ── Item handlers ──────────────────────────────────
  const handleAddItem = async () => {
    if (!user) return;
    const nome = itemNome.trim();
    if (!nome) { toast.error("Dê um nome ao item"); return; }
    const valor = parseFloat(itemValor.replace(",", "."));
    if (isNaN(valor) || valor < 0) { toast.error("Valor inválido"); return; }

    setItemSaving(true);
    const { error } = await supabase.from("evento_itens").insert({
      evento_id: id!, nome, valor_estimado: valor, responsavel_id: user.id,
    } as any);
    if (error) toast.error("Erro ao adicionar item");
    else { toast.success("Item adicionado! 🎉"); setItemNome(""); setItemValor(""); setItemPrestadores([]); setItemOpen(false); fetchAll(); }
    setItemSaving(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase.from("evento_itens").delete().eq("id", itemId);
    if (error) toast.error("Erro ao excluir"); else { toast.success("Item removido"); fetchAll(); }
  };

  const handleCoverUpload = async (file: File) => {
    if (!user || !id) return;
    setCoverUploading(true);
    // Compress image client-side
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    await new Promise((r) => (img.onload = r));
    const maxW = 1200;
    const scale = Math.min(1, maxW / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.8));

    const path = `eventos/${id}/cover_${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from("recibos").upload(path, blob, { contentType: "image/jpeg" });
    if (upErr) { toast.error("Erro ao enviar imagem"); setCoverUploading(false); return; }
    const url = supabase.storage.from("recibos").getPublicUrl(path).data.publicUrl;

    const { error } = await supabase.from("eventos_amigos").update({ imagem_url: url } as any).eq("id", id);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Foto do evento salva! 📸"); fetchAll(); }
    setCoverUploading(false);
  };

  // ── Computed saldos ──────────────────────────────────

  const saldos = useMemo(() => {
    if (!evento) return [];
    const aceitos = participantes.filter((p) => p.status === "aceito");
    const allMembers = [
      { user_id: evento.criador_id, nome: profileMap.get(evento.criador_id)?.nome || "Criador" },
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
  }, [evento, participantes, despesas, user, profileMap]);

  const totalGasto = despesas.reduce((s, d) => s + Number(d.valor), 0);
  const totalEstimado = itens.reduce((s, i) => s + Number(i.valor_estimado), 0);
  const numPessoas = saldos.length;
  const estimativaPorPessoa = numPessoas > 0 ? totalEstimado / numPessoas : 0;

  // Map items that have a matching despesa (by description containing item name)
  const itemDespesaMap = useMemo(() => {
    const map = new Map<string, Despesa>();
    for (const item of itens) {
      const normalName = item.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const match = despesas.find((d) => {
        const normalDesc = (d.descricao || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalDesc.includes(normalName) || normalName.includes(normalDesc);
      });
      if (match) map.set(item.id, match);
    }
    return map;
  }, [itens, despesas]);

  const getName = (uid: string) => (uid === user?.id ? "Você" : profileMap.get(uid)?.nome || "Morador");

  // ── Actions ──────────────────────────────────────────

  const openInvite = async () => {
    if (!condominioId) return;
    setInviteOpen(true);
    const { data } = await supabase.rpc("get_condominio_moradores", { _condominio_id: condominioId });
    setMoradores((data || []) as Morador[]);
  };

  const handleInvite = async (moradorId: string) => {
    setInviting(moradorId);
    const { error } = await supabase.from("evento_participantes").insert({ evento_id: id!, user_id: moradorId } as any);
    if (error) { error.code === "23505" ? toast.info("Já convidado") : toast.error("Erro ao convidar"); }
    else { toast.success("Convite enviado!"); fetchAll(); }
    setInviting(null);
  };

  const handleRespond = async (status: "aceito" | "recusado") => {
    if (!myParticipation) return;
    const { error } = await supabase.from("evento_participantes").update({ status } as any).eq("id", myParticipation.id);
    if (error) toast.error("Erro");
    else { toast.success(status === "aceito" ? "Convite aceito!" : "Convite recusado"); fetchAll(); }
  };

  const handleAddExpense = async () => {
    if (!user) return;
    const valor = parseFloat(expValor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) { toast.error("Valor inválido"); return; }
    if (!expDescricao.trim()) { toast.error("Descreva a despesa"); return; }

    setExpSaving(true);
    let reciboUrl: string | null = null;
    if (expRecibo) {
      const path = `${user.id}/${id}/${Date.now()}.${expRecibo.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("recibos").upload(path, expRecibo);
      if (upErr) { toast.error("Erro ao enviar recibo"); setExpSaving(false); return; }
      reciboUrl = supabase.storage.from("recibos").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from("evento_despesas").insert({
      evento_id: id!, pagador_id: user.id, valor, descricao: expDescricao.trim(), recibo_url: reciboUrl,
    } as any);
    if (error) toast.error("Erro ao registrar despesa");
    else {
      // Update linked item's valor_estimado to real value
      if (expItemId) {
        await supabase.from("evento_itens").update({ valor_estimado: valor } as any).eq("id", expItemId);
      }
      toast.success("Despesa registrada!"); setExpValor(""); setExpDescricao(""); setExpRecibo(null); setExpItemId(""); setExpenseOpen(false); fetchAll();
    }
    setExpSaving(false);
  };

  const handleDeleteExpense = async (expId: string) => {
    const { error } = await supabase.from("evento_despesas").delete().eq("id", expId);
    if (error) toast.error("Erro ao excluir"); else { toast.success("Despesa excluída"); fetchAll(); }
  };

  const handleCloseEvent = async () => {
    const { error } = await supabase.from("eventos_amigos").update({ status: "encerrado" } as any).eq("id", id!);
    if (error) toast.error("Erro"); else { toast.success("Evento encerrado!"); fetchAll(); }
  };

  const handleSavePix = async () => {
    setPixSaving(true);
    const { error } = await supabase.from("eventos_amigos").update({
      pix_chave: pixChave.trim() || null,
      pix_tipo: pixTipo,
    } as any).eq("id", id!);
    if (error) toast.error("Erro ao salvar PIX");
    else { toast.success("Chave PIX salva!"); setPixOpen(false); fetchAll(); }
    setPixSaving(false);
  };

  const copyPix = () => {
    if (evento?.pix_chave) {
      navigator.clipboard.writeText(evento.pix_chave);
      toast.success("Chave PIX copiada! 📋");
    }
  };

  const handleSendPayment = async () => {
    if (!user || !payTarget) return;
    setPaySaving(true);

    let comprovanteUrl: string | null = null;
    if (payFile) {
      const path = `${user.id}/${id}/pag_${Date.now()}.${payFile.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("recibos").upload(path, payFile);
      if (upErr) { toast.error("Erro ao enviar comprovante"); setPaySaving(false); return; }
      comprovanteUrl = supabase.storage.from("recibos").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from("evento_pagamentos").insert({
      evento_id: id!,
      pagador_id: user.id,
      recebedor_id: payTarget.userId,
      valor: payTarget.valor,
      comprovante_url: comprovanteUrl,
    } as any);

    if (error) toast.error("Erro ao registrar pagamento");
    else { toast.success("Comprovante enviado! 🎉"); setPayFile(null); setPayTarget(null); setPayOpen(false); fetchAll(); }
    setPaySaving(false);
  };

  const handleConfirmPayment = async (pagId: string) => {
    const { error } = await supabase.from("evento_pagamentos").update({ status: "confirmado" } as any).eq("id", pagId);
    if (error) toast.error("Erro"); else { toast.success("Pagamento confirmado! ✅"); fetchAll(); }
  };

  // ── Loading / null guards ────────────────────────────

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
    (m) => !participantes.some((p) => p.user_id === m.user_id) && m.user_id !== evento.criador_id && m.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // People who owe money (negative saldo)
  const devedores = saldos.filter((s) => s.saldo < -0.01);
  // People who should receive (positive saldo)
  const credores = saldos.filter((s) => s.saldo > 0.01);
  const todosOk = devedores.length === 0 && credores.length === 0 && saldos.length > 0;

  return (
    <MoradorLayout title={evento.titulo} showBack>
      <div className="flex flex-col gap-4 max-w-md mx-auto pb-6 relative">
        {/* Pending invite */}
        {myParticipation?.status === "pendente" && (
          <div className="rounded-[var(--radius-card)] p-4 animate-fade-in" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))", border: "2px solid hsl(var(--primary) / 0.3)" }}>
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper size={18} className="text-primary" />
              <p className="text-sm font-bold text-foreground">Você foi convidado! 🎉</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleRespond("aceito")} className="flex-1"><CheckCircle2 size={14} /> Aceitar</Button>
              <Button size="sm" variant="outline" onClick={() => handleRespond("recusado")} className="flex-1"><XCircle size={14} /> Recusar</Button>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 animate-fade-in">
          <div className="rounded-2xl p-3 text-center" style={{ background: "linear-gradient(135deg, hsl(var(--header-bg)), hsl(var(--primary) / 0.8))" }}>
            <p className="text-lg font-bold text-primary-foreground">R$ {formatBRL(totalGasto)}</p>
            <p className="text-[10px] text-primary-foreground/60 font-medium">Total gasto</p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-card shadow-sm border border-border">
            <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1"><Users size={16} className="text-primary" /> {numPessoas}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Pessoas</p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-card shadow-sm border border-border">
            <p className="text-lg font-bold text-primary">R$ {numPessoas > 0 ? formatBRL(totalGasto / numPessoas) : "0,00"}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Por pessoa</p>
          </div>
        </div>

        {/* Tabs — now 5 */}
        <Tabs defaultValue="evento" className="w-full animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <TabsList className="grid w-full grid-cols-5 h-12 rounded-2xl bg-muted p-1">
            <TabsTrigger value="evento" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm text-[10px] font-semibold">🎪 Evento</TabsTrigger>
            <TabsTrigger value="acerto" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm text-[10px] font-semibold">💸 Acerto</TabsTrigger>
            <TabsTrigger value="saldos" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm text-[10px] font-semibold">💰 Saldos</TabsTrigger>
            <TabsTrigger value="despesas" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm text-[10px] font-semibold">🧾 Gastos</TabsTrigger>
            <TabsTrigger value="pessoas" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm text-[10px] font-semibold">👥 Turma</TabsTrigger>
          </TabsList>

          {/* ═══ EVENTO TAB ═══ */}
          <TabsContent value="evento" className="flex flex-col gap-3 mt-3">
            {/* Event description */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--header-bg)), hsl(var(--primary) / 0.85))" }}>
              <div className="p-5 relative">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary-foreground/10 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <PartyPopper size={20} className="text-primary-foreground" />
                    <h3 className="text-primary-foreground font-bold text-base">O que vai rolar? 🎉</h3>
                  </div>
                  {evento.descricao ? (
                    <p className="text-primary-foreground/80 text-sm leading-relaxed">{evento.descricao}</p>
                  ) : (
                    <p className="text-primary-foreground/50 text-sm italic">Nenhuma descrição ainda</p>
                  )}
                </div>
              </div>
              <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="w-full h-3">
                <path d="M0,20 L0,10 Q100,0 200,10 Q300,20 400,10 L400,20 Z" fill="hsl(var(--background))" />
              </svg>
            </div>

            {/* Estimativa por pessoa */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl p-3 text-center bg-card shadow-sm border border-border">
                <p className="text-lg font-bold text-primary">R$ {formatBRL(totalEstimado)}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Estimativa total 🎯</p>
              </div>
              <div className="rounded-2xl p-3 text-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))" }}>
                <p className="text-lg font-bold text-primary">R$ {formatBRL(estimativaPorPessoa)}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Por pessoa (~{numPessoas}) 🧮</p>
              </div>
            </div>

            {/* Add item button */}
            {isParticipant && evento.status === "ativo" && (
              <Dialog open={itemOpen} onOpenChange={setItemOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full gap-2"><Plus size={14} /> Adicionar item</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Sparkles size={16} className="text-primary" /> Novo item do evento</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3">
                    <Input placeholder="O que é? (ex: Som, Banda, Tenda, Carne)" value={itemNome} onChange={(e) => handleItemNomeChange(e.target.value)} maxLength={100} />

                    {/* Provider search results */}
                    {itemSearching && (
                      <p className="text-xs text-muted-foreground animate-pulse">🔍 Buscando prestadores...</p>
                    )}
                    {itemPrestadores.length > 0 && (
                      <div className="rounded-xl border border-primary/20 overflow-hidden" style={{ background: "hsl(var(--primary) / 0.03)" }}>
                        <p className="text-[10px] font-semibold text-primary px-3 pt-2 uppercase tracking-wide">
                          🎯 Prestadores disponíveis no condomínio
                        </p>
                        <div className="flex flex-col divide-y divide-border">
                          {itemPrestadores.map((pres) => (
                            <div key={pres.id} className="flex items-center justify-between px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden" style={{ background: "hsl(var(--primary) / 0.15)" }}>
                                  {pres.avatar_url ? (
                                    <img src={pres.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-primary">{pres.nome.charAt(0)}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">{pres.nome}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{pres.especialidade}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] gap-1 shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => {
                                  setCotacaoCategoria(pres.especialidade);
                                  setItemOpen(false);
                                  setCotacaoOpen(true);
                                }}
                              >
                                <Search size={10} /> Cotar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {itemNome.trim().length >= 2 && !itemSearching && itemPrestadores.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">Nenhum prestador cadastrado para "{itemNome}"</p>
                    )}

                    <Input placeholder="Valor estimado (ex: 500,00)" value={itemValor} onChange={(e) => setItemValor(e.target.value)} inputMode="decimal" />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleAddItem} disabled={itemSaving}>{itemSaving ? "Adicionando..." : "Adicionar 🎪"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Items list */}
            {itens.length === 0 ? (
              <EmptyState icon="🎪" text="Nenhum item planejado ainda. Adicione o som, banda, tenda, carne..." />
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">📋 Itens do evento</p>
                {itens.map((item, idx) => {
                  const emojiMap: Record<string, string> = { som: "🔊", banda: "🎸", tenda: "⛺", carne: "🥩", bebida: "🍻", cerveja: "🍺", gelo: "🧊", carvão: "🔥", decoração: "🎊", doce: "🍰", bolo: "🎂", música: "🎵", dj: "🎧", churrasqueiro: "👨‍🍳", mesa: "🪑", cadeira: "🪑", luz: "💡", toalha: "🧻" };
                  const emoji = Object.entries(emojiMap).find(([k]) => item.nome.toLowerCase().includes(k))?.[1] || "🎯";

                  return (
                    <Card key={item.id} className="border-none shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: `${0.05 * idx}s` }}>
                      <CardContent className="p-0">
                        <div className="h-1 w-full" style={{ background: itemDespesaMap.has(item.id) ? "hsl(var(--success, 142 71% 45%))" : "linear-gradient(90deg, hsl(var(--primary) / 0.6), hsl(var(--primary-light) / 0.4))" }} />
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: itemDespesaMap.has(item.id) ? "hsl(var(--success, 142 71% 45%) / 0.12)" : "hsl(var(--primary) / 0.1)" }}>
                              {itemDespesaMap.has(item.id) ? <CheckCircle2 size={18} style={{ color: "hsl(var(--success, 142 71% 45%))" }} /> : emoji}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{item.nome}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {itemDespesaMap.has(item.id) ? "✅ Valor real confirmado" : (item.responsavel_id ? getName(item.responsavel_id) : "")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                              background: itemDespesaMap.has(item.id) ? "hsl(var(--success, 142 71% 45%) / 0.12)" : "hsl(var(--primary) / 0.1)",
                              color: itemDespesaMap.has(item.id) ? "hsl(var(--success, 142 71% 45%))" : "hsl(var(--primary))",
                            }}>
                              R$ {formatBRL(item.valor_estimado)}
                            </span>
                            {isParticipant && (
                              <button onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 size={14} className="text-destructive/60 hover:text-destructive" />
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Fun estimate footer */}
                <div className="rounded-2xl p-4 mt-1 text-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))" }}>
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="text-sm font-semibold text-foreground">
                    Cada um coloca ~<span className="text-primary">R$ {formatBRL(estimativaPorPessoa)}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    pra {numPessoas} pessoa{numPessoas !== 1 ? "s" : ""} · {itens.length} ite{itens.length !== 1 ? "ns" : "m"} planejado{itens.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {/* ═══ COTAÇÃO SECTION ═══ */}
            {isParticipant && evento.status === "ativo" && (
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">📢 Cotações</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Categoria (ex: Churrasqueiro)"
                      value={cotacaoCategoria}
                      onChange={(e) => setCotacaoCategoria(e.target.value)}
                      className="h-8 text-xs w-40"
                      maxLength={50}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      disabled={cotacaoCategoria.trim().length < 2}
                      onClick={() => setCotacaoOpen(true)}
                    >
                      <Search size={12} /> Cotar
                    </Button>
                  </div>
                </div>
                <CotacaoRespostasView
                  eventoId={id!}
                  userId={user!.id}
                  isCreator={isCreator}
                  onPrestadorSelected={() => fetchAll()}
                />
              </div>
            )}

            {/* Cotação dialog */}
            {evento && user && condominioId && (
              <CotacaoDialog
                open={cotacaoOpen}
                onOpenChange={setCotacaoOpen}
                eventoId={id!}
                condominioId={condominioId}
                userId={user.id}
                categoria={cotacaoCategoria}
                onSuccess={() => { setCotacaoCategoria(""); }}
              />
            )}
          </TabsContent>

          {/* ═══ ACERTO TAB ═══ */}
          <TabsContent value="acerto" className="flex flex-col gap-3 mt-3">
            {/* PIX info banner */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--header-bg)), hsl(var(--header-mid)))" }}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-primary-foreground font-bold text-sm flex items-center gap-2">
                    💳 Chave PIX do Organizador
                  </p>
                  {isCreator && (
                    <Dialog open={pixOpen} onOpenChange={setPixOpen}>
                      <DialogTrigger asChild>
                        <button className="text-[10px] text-primary-foreground/60 underline">Editar</button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Configurar PIX</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-3">
                          <Select value={pixTipo} onValueChange={setPixTipo}>
                            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cpf">CPF</SelectItem>
                              <SelectItem value="telefone">Telefone</SelectItem>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="aleatoria">Chave aleatória</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input placeholder="Sua chave PIX" value={pixChave} onChange={(e) => setPixChave(e.target.value)} maxLength={100} />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                          <Button onClick={handleSavePix} disabled={pixSaving}>{pixSaving ? "Salvando..." : "Salvar"}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                {evento.pix_chave ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-primary-foreground/10 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-primary-foreground/50 uppercase">{evento.pix_tipo || "pix"}</p>
                      <p className="text-sm text-primary-foreground font-mono font-semibold">{evento.pix_chave}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={copyPix} className="text-primary-foreground hover:bg-primary-foreground/10">
                      <Copy size={16} />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-primary-foreground/40">
                    {isCreator ? "Configure sua chave PIX para receber pagamentos" : "Organizador ainda não configurou o PIX"}
                  </p>
                )}
              </div>
              <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="w-full h-3">
                <path d="M0,20 L0,10 Q100,0 200,10 Q300,20 400,10 L400,20 Z" fill="hsl(var(--background))" />
              </svg>
            </div>

            {/* Status festivo */}
            {todosOk ? (
              <div className="rounded-2xl p-5 text-center animate-fade-in" style={{ background: "linear-gradient(135deg, hsl(var(--success) / 0.1), hsl(var(--success) / 0.05))" }}>
                <p className="text-3xl mb-2">🥳</p>
                <p className="font-bold text-foreground">Tudo certinho!</p>
                <p className="text-sm text-muted-foreground mt-1">Ninguém deve nada. A resenha foi um sucesso!</p>
              </div>
            ) : (
              <>
                {/* Devedores — quem precisa pagar */}
                {devedores.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">🔴 Quem precisa pagar</p>
                    {devedores.map((s) => {
                      const myPayments = pagamentos.filter((p) => p.pagador_id === s.user_id);
                      const confirmedTotal = myPayments.filter((p) => p.status === "confirmado").reduce((sum, p) => sum + Number(p.valor), 0);
                      const pendingTotal = myPayments.filter((p) => p.status === "pendente").reduce((sum, p) => sum + Number(p.valor), 0);
                      const remaining = Math.abs(s.saldo) - confirmedTotal - pendingTotal;
                      const isMe = s.user_id === user?.id;

                      return (
                        <Card key={s.user_id} className="border-none shadow-sm overflow-hidden">
                          <CardContent className="p-0">
                            <div className="h-1 w-full" style={{ background: remaining <= 0.01 ? "hsl(var(--success))" : "hsl(var(--destructive))" }} />
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: "hsl(var(--destructive) / 0.1)" }}>
                                    {remaining <= 0.01 ? "✅" : "💸"}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{s.nome}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {remaining <= 0.01
                                        ? "Tudo certo! 🎉"
                                        : `Falta R$ ${formatBRL(Math.max(remaining, 0))}`}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm font-bold" style={{ color: remaining <= 0.01 ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
                                  R$ {formatBRL(Math.abs(s.saldo))}
                                </p>
                              </div>

                              {/* Meus pagamentos enviados */}
                              {myPayments.length > 0 && (
                                <div className="mt-2 flex flex-col gap-1">
                                  {myPayments.map((pg) => (
                                    <div key={pg.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded-lg bg-muted/50">
                                      <span className="flex items-center gap-1">
                                        {pg.status === "confirmado" ? "✅" : "⏳"} R$ {formatBRL(pg.valor)}
                                      </span>
                                      <span>{pg.status === "confirmado" ? "Confirmado" : "Aguardando"}</span>
                                      {pg.comprovante_url && (
                                        <a href={pg.comprovante_url} target="_blank" rel="noopener noreferrer"><Image size={12} className="text-muted-foreground" /></a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Send payment button */}
                              {isMe && remaining > 0.01 && (
                                <Button
                                  size="sm"
                                  className="w-full mt-2 gap-2"
                                  onClick={() => {
                                    setPayTarget({ userId: credores[0]?.user_id || evento.criador_id, valor: Math.max(remaining, 0) });
                                    setPayOpen(true);
                                  }}
                                >
                                  <Send size={14} /> Enviar comprovante
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Credores — quem vai receber */}
                {credores.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">🟢 Quem vai receber</p>
                    {credores.map((s) => {
                      const receivedPayments = pagamentos.filter((p) => p.recebedor_id === s.user_id);
                      const isMe = s.user_id === user?.id;

                      return (
                        <Card key={s.user_id} className="border-none shadow-sm overflow-hidden">
                          <CardContent className="p-0">
                            <div className="h-1 w-full" style={{ background: "hsl(var(--success))" }} />
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: "hsl(var(--success) / 0.1)" }}>
                                    🤑
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{s.nome}</p>
                                    <p className="text-[10px] text-muted-foreground">Recebe de volta</p>
                                  </div>
                                </div>
                                <p className="text-sm font-bold" style={{ color: "hsl(var(--success))" }}>
                                  +R$ {formatBRL(s.saldo)}
                                </p>
                              </div>

                              {/* Pagamentos pendentes para confirmar */}
                              {isMe && receivedPayments.filter((p) => p.status === "pendente").length > 0 && (
                                <div className="mt-2 flex flex-col gap-1.5">
                                  <p className="text-[10px] font-semibold text-muted-foreground">Comprovantes para confirmar:</p>
                                  {receivedPayments.filter((p) => p.status === "pendente").map((pg) => (
                                    <div key={pg.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/50">
                                      <div className="flex items-center gap-2 text-xs">
                                        <span>⏳ {getName(pg.pagador_id)} — R$ {formatBRL(pg.valor)}</span>
                                        {pg.comprovante_url && (
                                          <a href={pg.comprovante_url} target="_blank" rel="noopener noreferrer">
                                            <Image size={14} className="text-primary" />
                                          </a>
                                        )}
                                      </div>
                                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleConfirmPayment(pg.id)}>
                                        <CheckCircle2 size={12} /> OK
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {isMe && receivedPayments.filter((p) => p.status === "confirmado").length > 0 && (
                                <div className="mt-1.5 flex flex-col gap-1">
                                  {receivedPayments.filter((p) => p.status === "confirmado").map((pg) => (
                                    <div key={pg.id} className="flex items-center gap-1 text-[10px] text-muted-foreground px-2">
                                      ✅ {getName(pg.pagador_id)} — R$ {formatBRL(pg.valor)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Zerados */}
                {saldos.filter((s) => Math.abs(s.saldo) <= 0.01).length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">⚪ Zerados</p>
                    {saldos.filter((s) => Math.abs(s.saldo) <= 0.01).map((s) => (
                      <div key={s.user_id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30">
                        <span className="text-sm">✅</span>
                        <p className="text-sm text-muted-foreground">{s.nome} — tudo certo!</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ═══ SALDOS TAB ═══ */}
          <TabsContent value="saldos" className="flex flex-col gap-2 mt-3">
            {saldos.length === 0 ? (
              <EmptyState icon="💰" text="Convide pessoas para ver os saldos" />
            ) : (
              saldos.map((s, idx) => {
                const isPositive = s.saldo > 0.01;
                const isNegative = s.saldo < -0.01;
                return (
                  <Card key={s.user_id} className="border-none shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: `${0.05 * idx}s` }}>
                    <CardContent className="p-0">
                      <div className="h-1 w-full" style={{ background: isPositive ? "hsl(var(--success))" : isNegative ? "hsl(var(--destructive))" : "hsl(var(--muted))" }} />
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold" style={{ background: isPositive ? "hsl(var(--success) / 0.1)" : isNegative ? "hsl(var(--destructive) / 0.1)" : "hsl(var(--muted))", color: isPositive ? "hsl(var(--success))" : isNegative ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }}>
                            {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : <Minus size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{s.nome}</p>
                            <p className="text-[10px] text-muted-foreground">Pagou R$ {formatBRL(s.pagou)}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold" style={{ color: isPositive ? "hsl(var(--success))" : isNegative ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }}>
                          {isPositive ? `+R$ ${formatBRL(s.saldo)}` : isNegative ? `-R$ ${formatBRL(Math.abs(s.saldo))}` : "Zerado ✅"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* ═══ DESPESAS TAB ═══ */}
          <TabsContent value="despesas" className="flex flex-col gap-2 mt-3">
            {isParticipant && evento.status === "ativo" && (
              <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full gap-2"><Receipt size={14} /> Registrar despesa</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles size={16} className="text-primary" /> Nova despesa</DialogTitle></DialogHeader>
                  <div className="flex flex-col gap-3">
                    {/* Link to item */}
                    {itens.length > 0 && (
                      <Select value={expItemId} onValueChange={(val) => {
                        setExpItemId(val === "none" ? "" : val);
                        if (val !== "none") {
                          const item = itens.find(i => i.id === val);
                          if (item) setExpDescricao(item.nome);
                        }
                      }}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Vincular a um item (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum item</SelectItem>
                          {itens.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nome} — R$ {formatBRL(item.valor_estimado)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input placeholder="O que comprou? (ex: Carne, Bebidas)" value={expDescricao} onChange={(e) => setExpDescricao(e.target.value)} maxLength={200} />
                    <Input placeholder="Valor (ex: 150,00)" value={expValor} onChange={(e) => setExpValor(e.target.value)} inputMode="decimal" />
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-muted-foreground flex items-center gap-1"><Camera size={14} /> Foto do recibo (opcional)</label>
                      <Input type="file" accept="image/*" capture="environment" onChange={(e) => setExpRecibo(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleAddExpense} disabled={expSaving}>{expSaving ? "Salvando..." : "Registrar 💸"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {despesas.length === 0 ? (
              <EmptyState icon="🧾" text="Nenhuma despesa registrada ainda" />
            ) : (
              despesas.map((d, idx) => (
                <Card key={d.id} className="border-none shadow-sm animate-fade-in" style={{ animationDelay: `${0.05 * idx}s` }}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm" style={{ background: "hsl(var(--primary) / 0.1)" }}>🛒</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{d.descricao}</p>
                          <p className="text-[10px] text-muted-foreground">{d.pagador_id === user?.id ? "Você" : d.pagador_nome} • {new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-sm font-bold text-primary">R$ {formatBRL(d.valor)}</p>
                        {d.recibo_url && <a href={d.recibo_url} target="_blank" rel="noopener noreferrer"><Image size={16} className="text-muted-foreground" /></a>}
                        {d.pagador_id === user?.id && <button onClick={() => handleDeleteExpense(d.id)}><Trash2 size={14} className="text-destructive" /></button>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ═══ PESSOAS TAB ═══ */}
          <TabsContent value="pessoas" className="flex flex-col gap-2 mt-3">
            {isCreator && evento.status === "ativo" && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild><Button size="sm" className="w-full gap-2" onClick={openInvite}><UserPlus size={14} /> Convidar vizinhos</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus size={16} className="text-primary" /> Convidar moradores</DialogTitle></DialogHeader>
                  <Input placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                    {filteredMoradores.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum morador disponível</p>
                    ) : (
                      filteredMoradores.map((m) => (
                        <div key={m.user_id} className="flex items-center justify-between p-2.5 rounded-xl border border-border">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-primary" style={{ background: "hsl(var(--primary) / 0.1)" }}>{m.nome?.charAt(0)?.toUpperCase() || "?"}</div>
                            <p className="text-sm font-medium">{m.nome}</p>
                          </div>
                          <Button size="sm" disabled={inviting === m.user_id} onClick={() => handleInvite(m.user_id)}>{inviting === m.user_id ? "..." : "Convidar"}</Button>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-light)))" }} />
                <div className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "hsl(var(--primary) / 0.1)" }}>👑</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{evento.criador_id === user?.id ? "Você" : getName(evento.criador_id)}</p>
                    <p className="text-[10px] text-primary font-medium">Organizador</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {participantes.map((p, idx) => {
              const sc = { aceito: { icon: <CheckCircle2 size={14} />, label: "Aceito", color: "hsl(var(--success))" }, recusado: { icon: <XCircle size={14} />, label: "Recusou", color: "hsl(var(--destructive))" }, pendente: { icon: <Clock size={14} />, label: "Pendente", color: "hsl(var(--warning))" } }[p.status] || { icon: <Clock size={14} />, label: p.status, color: "hsl(var(--muted-foreground))" };
              return (
                <Card key={p.id} className="border-none shadow-sm animate-fade-in" style={{ animationDelay: `${0.05 * (idx + 1)}s` }}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-foreground">{p.nome?.charAt(0)?.toUpperCase() || "?"}</div>
                      <p className="text-sm font-medium text-foreground">{p.user_id === user?.id ? "Você" : p.nome}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: sc.color }}>{sc.icon} {sc.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Close event */}
        {isCreator && evento.status === "ativo" && (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="text-destructive border-destructive mt-2">Encerrar evento</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Encerrar evento?</AlertDialogTitle><AlertDialogDescription>Após encerrar, ninguém poderá adicionar novas despesas.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleCloseEvent}>Encerrar</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Payment dialog */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">💸 Enviar comprovante</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Valor: <strong className="text-foreground">R$ {payTarget ? formatBRL(payTarget.valor) : "0,00"}</strong>
              </p>
              {evento.pix_chave && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted">
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase">{evento.pix_tipo}</p>
                    <p className="text-sm font-mono font-semibold text-foreground">{evento.pix_chave}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={copyPix}><Copy size={14} /></Button>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-muted-foreground flex items-center gap-1"><Camera size={14} /> Foto do comprovante</label>
                <Input type="file" accept="image/*" capture="environment" onChange={(e) => setPayFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button onClick={handleSendPayment} disabled={paySaving}>{paySaving ? "Enviando..." : "Enviar comprovante 📤"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MoradorLayout>
  );
};

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex flex-col items-center gap-3 py-8">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ background: "hsl(var(--primary) / 0.08)" }}>{icon}</div>
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default MoradorEntreAmigosDetalhe;

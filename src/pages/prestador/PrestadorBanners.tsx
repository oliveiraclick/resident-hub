import { useState, useEffect, useRef } from "react";
import { formatBRL } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, DollarSign, Image, ImagePlus, Camera, X, Send, Info, Clock, CheckCircle2, Minus, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
  ativo: { label: "Ativo", variant: "default" },
  expirado: { label: "Expirado", variant: "outline" },
};

const PrestadorBanners = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [precos, setPrecos] = useState<any>(null);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [ciclos, setCiclos] = useState(1);
  const [tipoArte, setTipoArte] = useState<"propria" | "solicitar">("propria");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !condominioId) return;
    const fetchAll = async () => {
      const [{ data: precosData }, { data: prestador }, { data: solis }] = await Promise.all([
        supabase.from("banner_precos").select("*").limit(1).maybeSingle(),
        supabase.from("prestadores").select("id").eq("user_id", user.id).eq("condominio_id", condominioId).maybeSingle(),
        supabase.from("banner_solicitacoes").select("*").order("created_at", { ascending: false }),
      ]);
      setPrecos(precosData);
      setPrestadorId(prestador?.id || null);
      setSolicitacoes(solis || []);
      setLoading(false);
    };
    fetchAll();
  }, [user, condominioId]);

  const dataFim = dataInicio ? addDays(dataInicio, 15 * ciclos - 1) : undefined;
  const valorQuinzenas = precos ? (precos.valor_quinzena || 0) * ciclos : 0;
  const valorArte = tipoArte === "solicitar" ? (precos?.valor_criacao_arte || 0) : 0;
  const valorTotal = valorQuinzenas + valorArte;

  const ativosNoCondominio = solicitacoes.filter(
    (s) => s.condominio_id === condominioId && ["pendente", "aprovado", "ativo"].includes(s.status)
  ).length;
  const limitReached = precos && ativosNoCondominio >= (precos.limite_por_condominio || 6);

  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file);
        }, "image/jpeg", quality);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    let processed = file;
    if (file.size > 1 * 1024 * 1024) processed = await compressImage(file);
    if (processed.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB"); return; }
    setImageFile(processed);
    setImagePreview(URL.createObjectURL(processed));
  };

  const handleSubmit = async () => {
    if (!dataInicio || !prestadorId || !condominioId || !user) return;
    if (tipoArte === "propria" && !imageFile) {
      toast.error("Envie a arte do banner");
      return;
    }
    setSubmitting(true);
    try {
      let imagem_url: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("banner-artes").upload(path, imageFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("banner-artes").getPublicUrl(path);
        imagem_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("banner_solicitacoes").insert({
        prestador_id: prestadorId,
        condominio_id: condominioId,
        data_inicio: format(dataInicio, "yyyy-MM-dd"),
        data_fim: format(dataFim!, "yyyy-MM-dd"),
        tipo_arte: tipoArte,
        imagem_url,
        valor_total: valorTotal,
        status: "pendente",
      });
      if (error) throw error;

      toast.success("Solicitação enviada!");
      setShowForm(false);
      setDataInicio(undefined);
      setCiclos(1);
      setTipoArte("propria");
      setImageFile(null);
      setImagePreview(null);

      // Refresh
      const { data: solis } = await supabase.from("banner_solicitacoes").select("*").order("created_at", { ascending: false });
      setSolicitacoes(solis || []);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar solicitação");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PrestadorLayout title="Banners">
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      </PrestadorLayout>
    );
  }

  return (
    <PrestadorLayout title="Banners" showBack>
      <div className="max-w-md mx-auto flex flex-col gap-4">
        {/* Pricing info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Anuncie no banner do app!</p>
                <p className="text-muted-foreground text-xs mb-2">Seu banner aparece para todos os moradores do condomínio por 15 dias.</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">Quinzena</p>
                    <p className="font-bold text-primary">R$ {formatBRL(precos?.valor_quinzena ?? 0)}</p>
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">Criação de arte</p>
                    <p className="font-bold text-primary">R$ {formatBRL(precos?.valor_criacao_arte ?? 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button
          onClick={() => setShowForm(!showForm)}
          disabled={!!limitReached}
          variant={showForm ? "outline" : "default"}
        >
          {limitReached ? "Limite atingido" : showForm ? "Cancelar" : "Solicitar Banner"}
        </Button>

        {/* Form */}
        {showForm && (
          <Card>
            <CardContent className="p-4 flex flex-col gap-4">
              {/* Date picker */}
              <div>
                <label className="text-sm font-medium mb-1 block">Data de início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}>
                      <Calendar size={16} className="mr-2" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarUI
                      mode="single"
                      selected={dataInicio}
                      onSelect={setDataInicio}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {dataInicio && dataFim && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Período: {format(dataInicio, "dd/MM")} a {format(dataFim, "dd/MM/yyyy")} ({ciclos * 15} dias)
                  </p>
                )}
              </div>

              {/* Ciclos */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quantas quinzenas?</label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    disabled={ciclos <= 1}
                    onClick={() => setCiclos((c) => Math.max(1, c - 1))}
                  >
                    <Minus size={16} />
                  </Button>
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-bold text-foreground">{ciclos}</p>
                    <p className="text-[10px] text-muted-foreground">{ciclos === 1 ? "quinzena" : "quinzenas"} ({ciclos * 15} dias)</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setCiclos((c) => c + 1)}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              {/* Tipo arte */}
              <div>
                <label className="text-sm font-medium mb-2 block">Arte do banner</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={tipoArte === "propria" ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col gap-1"
                    onClick={() => setTipoArte("propria")}
                  >
                    <ImagePlus size={18} />
                    <span className="text-xs">Enviar minha arte</span>
                  </Button>
                  <Button
                    type="button"
                    variant={tipoArte === "solicitar" ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col gap-1"
                    onClick={() => setTipoArte("solicitar")}
                  >
                    <Image size={18} />
                    <span className="text-xs">Solicitar criação</span>
                    <span className="text-[10px] text-muted-foreground">+R$ {formatBRL(precos?.valor_criacao_arte ?? 0)}</span>
                  </Button>
                </div>
              </div>

              {/* Image upload (only for propria) */}
              {tipoArte === "propria" && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Upload da arte (1080x540px ideal)</label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-border" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-background/80 rounded-full p-1">
                        <X size={14} className="text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 rounded-lg border border-dashed border-border p-3 bg-muted/30">
                      <Button type="button" variant="outline" className="flex-1 gap-2 h-12" onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus size={20} /> Galeria
                      </Button>
                      <Button type="button" variant="outline" className="flex-1 gap-2 h-12" onClick={() => cameraInputRef.current?.click()}>
                        <Camera size={20} /> Câmera
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Resumo */}
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-medium mb-1">Resumo</p>
                <div className="flex justify-between text-xs">
                  <span>{ciclos}x Quinzena (15 dias)</span>
                  <span>R$ {formatBRL(valorQuinzenas)}</span>
                </div>
                {tipoArte === "solicitar" && (
                  <div className="flex justify-between text-xs">
                    <span>Criação de arte</span>
                    <span>R$ {formatBRL(valorArte)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">R$ {formatBRL(valorTotal)}</span>
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={submitting || !dataInicio} className="gap-2">
                <Send size={16} />
                {submitting ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
        {solicitacoes.length > 0 && (
          <>
            <h3 className="text-sm font-semibold mt-2">Minhas Solicitações</h3>
            {solicitacoes.map((s) => {
              const st = statusMap[s.status] || statusMap.pendente;
              return (
                <Card key={s.id}>
                  <CardContent className="p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={12} className="text-primary" />
                        <span>
                          {new Date(s.data_inicio).toLocaleDateString("pt-BR")} — {new Date(s.data_fim).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{s.tipo_arte === "propria" ? "Arte própria" : "Criação solicitada"}</span>
                      <span className="font-medium text-foreground">R$ {formatBRL(s.valor_total)}</span>
                    </div>
                    {s.imagem_url && (
                      <img src={s.imagem_url} alt="Arte" className="w-full h-24 object-cover rounded-lg border border-border" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorBanners;

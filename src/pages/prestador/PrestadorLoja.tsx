import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, ImagePlus, Camera, X, Save, Copy, ExternalLink } from "lucide-react";

const PrestadorLoja = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [lojaId, setLojaId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [horario, setHorario] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [slug, setSlug] = useState("");
  const [ativa, setAtiva] = useState(true);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !condominioId) return;
    (async () => {
      const { data } = await supabase
        .from("prestadores")
        .select("id")
        .eq("user_id", user.id)
        .eq("condominio_id", condominioId)
        .maybeSingle();
      setPrestadorId(data?.id || null);
    })();
  }, [user, condominioId]);

  useEffect(() => {
    if (!prestadorId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("lojas")
        .select("*")
        .eq("prestador_id", prestadorId)
        .maybeSingle();
      if (data) {
        setLojaId(data.id);
        setNome(data.nome);
        setDescricao(data.descricao || "");
        setHorario(data.horario_funcionamento || "");
        setWhatsapp(data.whatsapp || "");
        setSlug(data.slug || "");
        setAtiva(data.ativa);
        setBannerPreview(data.banner_url);
      }
      setLoading(false);
    })();
  }, [prestadorId]);

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!prestadorId || !condominioId || !nome.trim()) {
      toast.error("Preencha o nome da loja");
      return;
    }
    setSaving(true);
    try {
      let banner_url = bannerPreview;

      if (bannerFile) {
        const ext = bannerFile.name.split(".").pop();
        const path = `${prestadorId}/banner.${ext}`;
        const { error: upErr } = await supabase.storage.from("produtos").upload(path, bannerFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("produtos").getPublicUrl(path);
        banner_url = urlData.publicUrl;
      }

      const sanitizedSlug = slug.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        horario_funcionamento: horario.trim() || null,
        whatsapp: whatsapp.trim() || null,
        slug: sanitizedSlug || null,
        ativa,
        banner_url,
      };

      if (lojaId) {
        const { error } = await supabase.from("lojas").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", lojaId);
        if (error) throw error;
        toast.success("Loja atualizada!");
      } else {
        const { data, error } = await supabase.from("lojas").insert({
          ...payload,
          prestador_id: prestadorId,
          condominio_id: condominioId,
        }).select("id").single();
        if (error) throw error;
        setLojaId(data.id);
        toast.success("Loja criada!");
      }
      setBannerFile(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PrestadorLayout title="Minha Loja" showBack>
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-2">
                <Store size={20} className="text-primary" />
                <h2 className="text-[16px] font-semibold text-foreground">
                  {lojaId ? "Editar Loja" : "Criar Minha Loja"}
                </h2>
              </div>

              {/* Banner */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Banner da loja</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
                {bannerPreview ? (
                  <div className="relative">
                    <img src={bannerPreview} alt="Banner" className="w-full h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                      className="absolute top-1 right-1 bg-background/80 rounded-full p-1"
                    >
                      <X size={14} className="text-destructive" />
                    </button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                    <ImagePlus size={16} /> Adicionar banner
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Nome da loja *</label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Doces da Maria" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Descrição</label>
                <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Sobre sua loja..." rows={3} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Horário de funcionamento</label>
                <Input value={horario} onChange={e => setHorario(e.target.value)} placeholder="Ex: Seg-Sex 9h-18h" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">WhatsApp (contato)</label>
                <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
              </div>

              {/* Slug / Link público */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Link público da loja</label>
                <div className="flex gap-2">
                  <div className="flex items-center bg-muted rounded-l-lg px-2 text-[12px] text-muted-foreground border border-r-0 border-border">
                    morador.app/
                  </div>
                  <Input
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="minha-loja"
                    className="rounded-l-none"
                  />
                </div>
                {slug && lojaId && (
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={`/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> Ver vitrine pública
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
                        toast.success("Link copiado!");
                      }}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Copy size={12} /> Copiar link
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-foreground">Loja ativa</label>
                <Switch checked={ativa} onCheckedChange={setAtiva} />
              </div>

              <Button onClick={handleSave} disabled={saving || !nome.trim()} className="gap-1.5">
                <Save size={16} />
                {saving ? "Salvando..." : lojaId ? "Salvar alterações" : "Criar loja"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorLoja;

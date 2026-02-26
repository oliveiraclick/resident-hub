import { useEffect, useState, useRef } from "react";
import MasterLayout from "@/components/MasterLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Upload, Image, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface LpItem {
  id: string;
  secao: string;
  chave: string;
  valor: string;
  imagem_url: string | null;
  ordem: number;
}

const SECAO_LABELS: Record<string, string> = {
  hero: "🏠 Hero (Topo)",
  beneficios: "⭐ Benefícios",
  como_funciona: "🔧 Como Funciona",
  para_condominio: "🏢 Para Condomínios",
  para_prestador: "🔨 Para Prestadores",
  precos: "💰 Preços",
  depoimentos: "💬 Depoimentos",
  cta_final: "🚀 CTA Final",
  footer: "📋 Footer",
};

const SECAO_ORDER = ["hero", "beneficios", "como_funciona", "para_condominio", "para_prestador", "precos", "depoimentos", "cta_final", "footer"];

const MasterLP = () => {
  const [items, setItems] = useState<LpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("lp_content")
      .select("*")
      .order("ordem", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar conteúdo da LP");
      console.error(error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const handleChange = (id: string, field: "valor" | "imagem_url", value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = items.map((item) =>
        supabase
          .from("lp_content")
          .update({ valor: item.valor, imagem_url: item.imagem_url, updated_at: new Date().toISOString() })
          .eq("id", item.id)
      );
      await Promise.all(updates);
      toast.success("Conteúdo da LP salvo com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar");
      console.error(e);
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !activeItemId) return;
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `lp/${activeItemId}.${ext}`;

    setUploading(activeItemId);
    const { error: upErr } = await supabase.storage.from("lp-images").upload(path, file, { upsert: true });

    if (upErr) {
      toast.error("Erro no upload");
      console.error(upErr);
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("lp-images").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + "?t=" + Date.now();

    handleChange(activeItemId, "imagem_url", publicUrl);
    setUploading(null);
    toast.success("Imagem enviada!");
    e.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    handleChange(id, "imagem_url", "");
  };

  const toggleSection = (secao: string) => {
    setOpenSections((prev) => ({ ...prev, [secao]: !prev[secao] }));
  };

  const grouped = SECAO_ORDER.reduce<Record<string, LpItem[]>>((acc, secao) => {
    acc[secao] = items.filter((i) => i.secao === secao).sort((a, b) => a.ordem - b.ordem);
    return acc;
  }, {});

  if (loading) {
    return (
      <MasterLayout title="Landing Page">
        <p className="text-muted-foreground">Carregando...</p>
      </MasterLayout>
    );
  }

  const CHAVE_LABELS: Record<string, string> = {
    imagem_phone: "📱 Imagem do Telefone (Hero)",
  };

  const formatLabel = (chave: string) => {
    if (CHAVE_LABELS[chave]) return CHAVE_LABELS[chave];
    return chave
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const isLongText = (chave: string) => {
    return ["subtitulo", "desc", "texto", "slogan", "social_proof", "desc_secao"].some((k) =>
      chave.includes(k)
    );
  };

  const isImageOnly = (chave: string) => {
    return ["imagem_phone"].includes(chave);
  };

  return (
    <MasterLayout title="Landing Page">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <div className="flex items-center justify-between mb-4">
        <p className="text-muted-foreground text-body">Edite todos os textos e imagens da LP</p>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save size={16} className="mr-1" />
          {saving ? "Salvando..." : "Salvar tudo"}
        </Button>
      </div>

      <div className="space-y-3">
        {SECAO_ORDER.map((secao) => {
          const sectionItems = grouped[secao] || [];
          if (sectionItems.length === 0) return null;
          const isOpen = openSections[secao] ?? false;

          return (
            <Card key={secao} className="rounded-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection(secao)}
              >
                <span className="font-semibold text-sm">{SECAO_LABELS[secao] || secao}</span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isOpen && (
                <CardContent className="pt-0 space-y-4">
                  {sectionItems.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <label className="text-label text-muted-foreground">
                        {formatLabel(item.chave)}
                      </label>

                      {!isImageOnly(item.chave) && (
                        isLongText(item.chave) ? (
                          <Textarea
                            value={item.valor}
                            onChange={(e) => handleChange(item.id, "valor", e.target.value)}
                            rows={3}
                            className="text-body"
                          />
                        ) : (
                          <Input
                            value={item.valor}
                            onChange={(e) => handleChange(item.id, "valor", e.target.value)}
                          />
                        )
                      )}

                      {/* Image section */}
                      <div className="flex items-center gap-2">
                        {item.imagem_url ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={item.imagem_url}
                              alt=""
                              className="h-16 w-16 rounded-lg object-cover border border-border"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveImage(item.id)}
                            >
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </div>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploading === item.id}
                          onClick={() => {
                            setActiveItemId(item.id);
                            fileInputRef.current?.click();
                          }}
                        >
                          <Upload size={14} className="mr-1" />
                          {uploading === item.id ? "Enviando..." : item.imagem_url ? "Trocar" : "Imagem"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? "Salvando..." : "Salvar todas as alterações"}
        </Button>
      </div>
    </MasterLayout>
  );
};

export default MasterLP;

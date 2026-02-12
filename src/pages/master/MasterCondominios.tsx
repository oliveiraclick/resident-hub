import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Upload, X, Building2 } from "lucide-react";
import { toast } from "sonner";

interface CondominioRow {
  id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  responsavel: string | null;
  logo_url: string | null;
  created_at: string;
  totalUsuarios: number;
  totalUnidades: number;
}

const MasterCondominios = () => {
  const [condominios, setCondominios] = useState<CondominioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const [condRes, rolesRes, unidadesRes] = await Promise.all([
      supabase.from("condominios").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("condominio_id"),
      supabase.from("unidades").select("condominio_id"),
    ]);

    const conds = condRes.data || [];
    const roles = rolesRes.data || [];
    const unidades = unidadesRes.data || [];

    setCondominios(
      conds.map((c: any) => ({
        ...c,
        totalUsuarios: roles.filter((r) => r.condominio_id === c.id).length,
        totalUnidades: unidades.filter((u) => u.condominio_id === c.id).length,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setNome("");
    setEndereco("");
    setTelefone("");
    setResponsavel("");
    setLogoFile(null);
    setLogoPreview(null);
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    let logo_url: string | null = null;

    // Upload logo if provided
    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("condominio-logos")
        .upload(path, logoFile);

      if (uploadError) {
        toast.error("Erro ao enviar logo");
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("condominio-logos")
        .getPublicUrl(path);
      logo_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("condominios").insert({
      nome,
      endereco: endereco || null,
      telefone: telefone || null,
      responsavel: responsavel || null,
      logo_url,
    });

    setSaving(false);

    if (error) {
      toast.error("Erro ao criar condomínio");
    } else {
      toast.success("Condomínio criado");
      resetForm();
      fetchData();
    }
  };

  return (
    <MasterLayout title="Condomínios">
      <div className="mb-4">
        <Button onClick={() => setShowForm(!showForm)} className="rounded-[var(--radius-button)]">
          <Plus size={16} className="mr-2" /> Criar Condomínio
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-[var(--radius-card)] mb-4">
          <CardContent className="p-4 space-y-3">
            {/* Logo upload */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Upload size={24} className="text-muted-foreground" />
                )}
              </button>
              <span className="text-[11px] text-muted-foreground">Logo do condomínio (opcional)</span>
              {logoPreview && (
                <button
                  onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                  className="text-[11px] text-destructive flex items-center gap-1"
                >
                  <X size={12} /> Remover
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <Input placeholder="Nome *" value={nome} onChange={(e) => setNome(e.target.value)} className="h-[52px]" />
            <Input placeholder="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="h-[52px]" />
            <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="h-[52px]" />
            <Input placeholder="Nome do responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="h-[52px]" />
            <Button onClick={handleCreate} disabled={saving} className="rounded-[var(--radius-button)] w-full">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {condominios.map((c) => (
            <Card key={c.id} className="rounded-[var(--radius-card)]">
              <CardContent className="p-4">
                <div className="flex gap-3 items-start">
                  <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.nome} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">{c.endereco || "Sem endereço"}</p>
                        {c.responsavel && <p className="text-xs text-muted-foreground">Resp: {c.responsavel}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{c.totalUsuarios} usuários</span>
                      <span>{c.totalUnidades} unidades</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MasterLayout>
  );
};

export default MasterCondominios;

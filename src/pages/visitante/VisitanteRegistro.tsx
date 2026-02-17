import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import QrDisplay from "@/components/QrDisplay";
import { Camera, CheckCircle2, XCircle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import logoMorador from "@/assets/logo-morador.png";

type ConviteData = {
  id: string;
  nome_visitante: string;
  data_visita: string;
  horario_inicio: string;
  horario_fim: string;
  status: string;
  qr_code: string | null;
};

const VisitanteRegistro = () => {
  const { token } = useParams<{ token: string }>();
  const [convite, setConvite] = useState<ConviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [nome, setNome] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;

    const fetchConvite = async () => {
      // Use service role via edge function for public access
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/convite-visitante?token=${encodeURIComponent(token)}`,
        {
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Convite não encontrado");
        setLoading(false);
        return;
      }

      setConvite(data.convite);

      if (data.convite.status === "registrado" || data.convite.status === "usado") {
        setDone(true);
        setQrCode(data.convite.qr_code);
      }

      setNome(data.convite.nome_visitante || "");
      setLoading(false);
    };

    fetchConvite();
  }, [token]);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    if (!fotoFile) {
      toast.error("Tire uma foto para identificação");
      return;
    }
    if (!convite || !token) return;

    setSubmitting(true);

    try {
      // Upload photo and register via edge function
      const formData = new FormData();
      formData.append("token", token);
      formData.append("nome", nome.trim());
      formData.append("foto", fotoFile);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/convite-visitante`,
        {
          method: "POST",
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Erro ao registrar");
        return;
      }

      setQrCode(data.qr_code);
      setDone(true);
      toast.success("Cadastro realizado!");
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 gap-4">
        <XCircle size={64} className="text-destructive" />
        <p className="text-center text-lg font-semibold text-foreground">{error}</p>
        <p className="text-center text-sm text-muted-foreground">
          Este convite pode ter expirado ou já foi utilizado.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div
          className="flex flex-col items-center pt-10 pb-14 px-6"
          style={{
            background: "linear-gradient(145deg, hsl(var(--header-bg)) 0%, hsl(var(--header-mid)) 40%, hsl(var(--primary)) 100%)",
          }}
        >
          <img src={logoMorador} alt="Morador.app" className="h-14 w-14 object-contain relative z-10" />
          <h1 className="mt-3 text-white text-[20px] font-bold relative z-10">
            {done ? "Cadastro Confirmado" : "Registro de Visitante"}
          </h1>
          {convite && (
            <p className="mt-1 text-white/60 text-[13px] relative z-10">
              Visita em {new Date(convite.data_visita + "T00:00:00").toLocaleDateString("pt-BR")} • {convite.horario_inicio.slice(0, 5)} - {convite.horario_fim.slice(0, 5)}
            </p>
          )}
        </div>
        <svg viewBox="0 0 430 40" preserveAspectRatio="none" className="absolute -bottom-[1px] left-0 w-full h-[35px] block">
          <path d="M0,20 Q107,45 215,20 Q323,-5 430,20 L430,40 L0,40 Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      <div className="px-6 pb-8 max-w-md mx-auto">
        {done && qrCode ? (
          /* QR Code result */
          <div className="flex flex-col items-center gap-6 pt-4">
            <Card className="w-full">
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <CheckCircle2 size={48} className="text-success" />
                <p className="text-center font-semibold text-foreground">
                  Seu cadastro foi realizado com sucesso!
                </p>
                <div className="w-full border-t border-border pt-4">
                  <QrDisplay value={qrCode} label="Apresente este QR na portaria" size={220} />
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground text-center px-4">
              Este QR Code é válido apenas para a data e horário do convite. Uso único.
            </p>
          </div>
        ) : (
          /* Registration form */
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium ml-1">Seu nome completo</label>
              <Input
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            {/* Photo capture */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium ml-1">Foto para identificação</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFoto}
                className="hidden"
              />

              {fotoPreview ? (
                <div className="relative w-32 h-32 mx-auto">
                  <img
                    src={fotoPreview}
                    alt="Foto"
                    className="w-full h-full rounded-2xl object-cover border-2 border-primary"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white"
                  >
                    <Camera size={14} />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2 h-24 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={20} />
                  Tirar foto
                </Button>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="mt-2 gap-2">
              <UserCheck size={18} />
              {submitting ? "Registrando..." : "Confirmar cadastro"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitanteRegistro;

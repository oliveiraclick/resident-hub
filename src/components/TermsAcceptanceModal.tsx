import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck } from "lucide-react";

const TermsAcceptanceModal = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("termos_aceitos_em, condicoes_aceitas_em")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && (!data.termos_aceitos_em || !data.condicoes_aceitas_em)) {
        setOpen(true);
      }
      setLoading(false);
    };
    check();
  }, [user]);

  const handleAccept = async () => {
    if (!user || !check1 || !check2) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    await supabase
      .from("profiles")
      .update({ termos_aceitos_em: now, condicoes_aceitas_em: now })
      .eq("user_id", user.id);
    setOpen(false);
    setSubmitting(false);
  };

  if (loading || !open) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-[400px] rounded-2xl" onEscapeKeyDown={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={22} className="text-primary" />
            <AlertDialogTitle className="text-[16px]">Aceite os termos</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[13px] leading-relaxed">
            Para continuar usando o app, por favor leia e aceite nossos termos atualizados.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 mt-2">
          <div className="flex items-start gap-2">
            <Checkbox id="t1" checked={check1} onCheckedChange={(v) => setCheck1(!!v)} className="mt-0.5" />
            <label htmlFor="t1" className="text-xs text-muted-foreground leading-relaxed">
              Li e concordo com a{" "}
              <a href="/politica-privacidade" target="_blank" className="text-primary underline">Política de Privacidade</a> e os{" "}
              <a href="/termos-de-uso" target="_blank" className="text-primary underline">Termos de Uso</a>, em conformidade com a LGPD.
            </label>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="t2" checked={check2} onCheckedChange={(v) => setCheck2(!!v)} className="mt-0.5" />
            <label htmlFor="t2" className="text-xs text-muted-foreground leading-relaxed">
              Li e concordo com as{" "}
              <a href="/condicoes-de-uso" target="_blank" className="text-primary underline">Condições de Uso</a> da plataforma.
            </label>
          </div>
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogAction
            onClick={handleAccept}
            disabled={!check1 || !check2 || submitting}
            className="w-full"
          >
            {submitting ? "Salvando..." : "Aceitar e continuar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TermsAcceptanceModal;

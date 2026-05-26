import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const CompletarCadastroGate = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("telefone")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (cancel) return;
      const tel = (data?.telefone || "").trim();
      if (!tel) setOpen(true);
      setChecked(true);
    })();
    return () => { cancel = true; };
  }, [user]);

  const handleSave = async () => {
    const clean = telefone.replace(/\D/g, "");
    if (clean.length < 10) {
      toast.error("Informe um telefone válido com DDD");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ telefone: telefone.trim() })
      .eq("user_id", user!.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar telefone");
      return;
    }
    toast.success("Cadastro completo!");
    setOpen(false);
  };

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={() => { /* bloqueia fechar */ }}>
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Complete seu cadastro</DialogTitle>
            <DialogDescription>
              Para continuar usando o app, precisamos do seu telefone de contato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="tel-gate">Telefone (WhatsApp)</Label>
            <Input
              id="tel-gate"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              autoFocus
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Salvar e continuar"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

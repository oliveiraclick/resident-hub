import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminConfiguracoes = () => {
  const { user, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);

    try {
      // Delete profile and related data (cascading via FK), then sign out
      await supabase.from("profiles").delete().eq("user_id", user.id);
      await supabase.from("user_roles").delete().eq("user_id", user.id);
      await signOut();
      toast.success("Conta excluída com sucesso.");
      window.location.href = "/auth";
    } catch {
      toast.error("Erro ao excluir conta. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Configurações">
      <div className="p-4 space-y-6 max-w-md mx-auto pb-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie as configurações da sua conta.</p>
        </div>

        {/* Excluir conta */}
        <div className="flex justify-center pt-2 pb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-xs text-muted-foreground underline hover:text-destructive transition-colors">
                Excluir minha conta
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-destructive" />
                  Tem certeza absoluta?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação é irreversível. Todos os seus dados, perfil e acessos serão permanentemente excluídos.
                  <br /><br />
                  Digite <strong>EXCLUIR</strong> para confirmar:
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder='Digite "EXCLUIR"'
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirmText !== "EXCLUIR" || deleting}
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Excluindo..." : "Confirmar exclusão"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminConfiguracoes;

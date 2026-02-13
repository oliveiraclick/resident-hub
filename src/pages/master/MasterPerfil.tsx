import MasterLayout from "@/components/MasterLayout";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const MasterPerfil = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <MasterLayout title="Perfil">
      <div className="p-4 space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Perfil do Super Admin</h2>
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut size={18} className="mr-2" />
          Sair da conta
        </Button>
      </div>
    </MasterLayout>
  );
};

export default MasterPerfil;

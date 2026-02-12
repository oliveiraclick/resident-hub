import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { roles, rolesLoading, isPlatformAdmin } = useAuth();

  if (rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isPlatformAdmin) return <Navigate to="/master" replace />;

  const firstRole = roles[0]?.role;

  if (firstRole === "admin") return <Navigate to="/admin" replace />;
  if (firstRole === "prestador") return <Navigate to="/prestador" replace />;
  if (firstRole === "morador") return <Navigate to="/morador" replace />;

  // Sem role atribuída ainda
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <p className="text-center text-muted-foreground">
        Sua conta ainda não possui um perfil vinculado. Entre em contato com a administração do seu condomínio.
      </p>
    </div>
  );
};

export default Dashboard;

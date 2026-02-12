import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, isPlatformAdmin, rolesLoading } = useAuth();
  const location = useLocation();

  if (loading || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-body">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // platform_admin must go to /master
  if (isPlatformAdmin && !location.pathname.startsWith("/master")) {
    return <Navigate to="/master" replace />;
  }

  // non platform_admin cannot access /master
  if (!isPlatformAdmin && location.pathname.startsWith("/master")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

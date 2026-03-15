import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isNativeApp } from "@/lib/nativeDetect";
import LandingPage from "./LandingPage";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  // No app nativo, pula a Landing Page e vai direto pro login
  if (isNativeApp) return <Navigate to="/auth" replace />;

  return <LandingPage />;
};

export default Index;

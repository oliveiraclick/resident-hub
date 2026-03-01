import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from "@capacitor/core";
import LandingPage from "./LandingPage";

/** Detect native app via ?native=1 query param set in capacitor.config.ts */
const detectNativeApp = (): boolean => {
  if (Capacitor.isNativePlatform()) return true;
  const params = new URLSearchParams(window.location.search);
  return params.get("native") === "1";
};

const Index = () => {
  const { user, loading } = useAuth();
  const isNativeApp = detectNativeApp();

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

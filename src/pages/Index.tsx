import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from "@capacitor/core";
import LandingPage from "./LandingPage";

/** Detect native app — either real Capacitor native or WebView loading our URL */
const detectNativeApp = (): boolean => {
  if (Capacitor.isNativePlatform()) return true;
  const ua = navigator.userAgent || "";
  // iOS WebView (WKWebView doesn't have "Safari" in standalone UA)
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua)) return true;
  // Android WebView
  if (/Android/.test(ua) && /wv|Version\/[\d.]+.*Chrome/.test(ua)) return true;
  // Capacitor adds this to the UA in some configurations
  if (/Capacitor/.test(ua)) return true;
  return false;
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

/**
 * Detects if the app is running inside a native Capacitor WebView.
 * Captured ONCE at module load time (before React Router strips query params).
 * All other files should import `isNativeApp` from here.
 */

const params = new URLSearchParams(window.location.search);
const hasNativeParam = params.get("native") === "1";
const ua = navigator.userAgent;
const hasWvUA = /\b(capacitor|wv)\b/i.test(ua);
const isIOSWebView =
  /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);

export const isNativeApp: boolean = hasNativeParam || hasWvUA || isIOSWebView;

console.log("[Native] Detection at startup:", {
  hasNativeParam,
  hasWvUA,
  isIOSWebView,
  isNativeApp,
  ua: ua.substring(0, 120),
});

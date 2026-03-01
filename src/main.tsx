import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Mark body as native when running inside Capacitor WebView
const params = new URLSearchParams(window.location.search);
if (params.get("native") === "1" || /\b(capacitor|wv)\b/i.test(navigator.userAgent)) {
  document.body.classList.add("native-app");
}

createRoot(document.getElementById("root")!).render(<App />);

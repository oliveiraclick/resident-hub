import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isNativeApp } from "@/lib/nativeDetect";

// Mark body as native when running inside Capacitor WebView
if (isNativeApp) {
  document.body.classList.add("native-app");
}

createRoot(document.getElementById("root")!).render(<App />);

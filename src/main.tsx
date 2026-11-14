import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { ThemeProvider } from "@/hooks/useTheme";
import { registerOfflineMode } from "@/lib/browser/register-sw";
import "@/styles/tokens.css";
import "@/styles/base.css";

const container = document.getElementById("root");
if (!container) throw new Error("Elemen #root tidak ditemukan");

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

// Offline mode (ADR-0013) didaftarkan setelah paint pertama agar tidak menunda
// interaksi. Satu-satunya permintaan jaringan rutin adalah `version.json`.
if (import.meta.env.PROD) {
  void registerOfflineMode();
}

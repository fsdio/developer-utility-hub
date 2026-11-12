import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { ThemeProvider } from "@/hooks/useTheme";
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

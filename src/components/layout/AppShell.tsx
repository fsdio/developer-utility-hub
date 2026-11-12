import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#konten-utama">
        Langsung ke konten
      </a>
      <Header />
      <main className="main" id="konten-utama" tabIndex={-1}>
        <div className="container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Pesan khusus untuk kegagalan memuat chunk (technical-design §8). */
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Tidak ada pelaporan ke server (PRD §3): cukup catat di konsol lokal.
    console.error("Kesalahan render:", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="status status--error" role="alert">
        <div>
          <strong>{this.props.fallbackTitle ?? "Terjadi kesalahan saat menampilkan halaman."}</strong>
          <p style={{ marginTop: "var(--space-2)" }}>
            Muat ulang halaman untuk mencoba lagi. Tidak ada data Anda yang hilang, karena input
            tidak pernah disimpan.
          </p>
          <p style={{ marginTop: "var(--space-2)" }}>
            <button type="button" className="button" onClick={() => window.location.reload()}>
              Muat ulang
            </button>
          </p>
        </div>
      </div>
    );
  }
}

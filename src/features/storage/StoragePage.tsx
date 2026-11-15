import { useCallback, useEffect, useState } from "react";
import { StatusMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/editor/Panel";
import {
  collectStorageReport,
  clearAppPreferences,
  clearCacheStorage,
  preferenceBytes,
  unregisterServiceWorker,
  type ClearResult,
  type StorageReport,
} from "@/lib/browser/storage-report";

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Kelola penyimpanan (ADR-0022).
 *
 * Pengguna bisa melihat **apa saja** yang disimpan situs ini di peramban dan
 * menghapusnya per kelompok. Semua operasi berjalan lokal: tidak ada permintaan
 * jaringan, tidak ada data yang dikirim keluar, dan kunci milik situs lain di
 * origin yang sama tidak pernah disentuh.
 */
export function StoragePage() {
  const [report, setReport] = useState<StorageReport | null>(null);
  const [busy, setBusy] = useState<null | "refresh" | "preferences" | "caches" | "worker">(null);
  const [messages, setMessages] = useState<ClearResult[]>([]);

  const refresh = useCallback(async (): Promise<void> => {
    setBusy("refresh");
    setReport(await collectStorageReport());
    setBusy(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (
    scope: "preferences" | "caches" | "worker",
    action: () => ClearResult | Promise<ClearResult>,
  ): Promise<void> => {
    setBusy(scope);
    const result = await action();
    setBusy(null);
    setMessages((current) => [result, ...current].slice(0, 3));
    if (result.ok) setReport(await collectStorageReport());
  };

  const totalPreferences = report ? preferenceBytes(report) : 0;
  const cacheEntries = report?.caches.reduce((total, entry) => total + entry.entries, 0) ?? 0;

  return (
    <>
      <header className="tool-header">
        <h1 tabIndex={-1} data-route-heading>
          Kelola penyimpanan
        </h1>
        <p className="tool-description">
          Semua data situs ini hidup di peramban Anda. Lihat isinya, lalu hapus per kelompok —
          tidak ada yang dikirim ke server.
        </p>
      </header>

      {messages.length > 0 ? (
        <div className="result-block">
          {messages.map((message) => (
            <StatusMessage key={`${message.scope}-${message.message}`} tone={message.ok ? "success" : "error"}>
              {message.message}
            </StatusMessage>
          ))}
        </div>
      ) : null}

      <div className="tool-panels tool-panels--stack">
        <Panel
          label="Ringkasan"
          footer={
            report
              ? `${report.origin} · perkiraan pemakaian ${report.usage !== null ? formatBytes(report.usage) : "tidak tersedia"}`
              : "membaca penyimpanan…"
          }
        >
          <ul className="storage-list">
            <li className="storage-row">
              <span className="storage-name">Preferensi (localStorage + sessionStorage)</span>
              <span className="storage-value">
                {report ? `${report.local.length + report.session.length} kunci · ${formatBytes(totalPreferences)}` : "…"}
              </span>
            </li>
            <li className="storage-row">
              <span className="storage-name">Cache aplikasi (offline)</span>
              <span className="storage-value">
                {report ? `${report.caches.length} cache · ${cacheEntries} entri` : "…"}
              </span>
            </li>
            <li className="storage-row">
              <span className="storage-name">Kuota penyimpanan peramban</span>
              <span className="storage-value">
                {report?.quota !== null && report?.quota !== undefined ? formatBytes(report.quota) : "tidak tersedia"}
              </span>
            </li>
          </ul>
          <div className="field-body field-body--inline">
            <Button onClick={() => void refresh()} disabled={busy !== null}>
              {busy === "refresh" ? "Membaca…" : "Muat ulang laporan"}
            </Button>
          </div>
        </Panel>

        <Panel
          label="Data yang disimpan"
          footer="Hanya kunci berawalan duh: yang ditampilkan; isi input tool tidak pernah disimpan."
        >
          {report === null ? (
            <p className="hint-text hint-text--tight storage-pad">Membaca…</p>
          ) : report.local.length === 0 && report.session.length === 0 ? (
            <p className="hint-text hint-text--tight storage-pad">
              Belum ada preferensi tersimpan. Pilihan tema dan opsi tool akan muncul di sini setelah
              Anda memakainya.
            </p>
          ) : (
            <ul className="storage-list">
              {[...report.local, ...report.session].map((entry) => (
                <li className="storage-row" key={entry.key}>
                  <span className="storage-name">{entry.label}</span>
                  <span className="storage-value">
                    {formatBytes(entry.bytes)} · <code>{entry.value || "kosong"}</code>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {report && report.foreignKeys.length > 0 ? (
            <p className="hint-text hint-text--tight storage-pad">
              {report.foreignKeys.length} kunci lain di origin ini bukan milik aplikasi dan tidak
              akan dihapus.
            </p>
          ) : null}
        </Panel>

        <Panel label="Bersihkan" footer="Tindakan di sini hanya menyentuh data situs ini.">
          <ul className="storage-list">
            <li className="storage-row">
              <span className="storage-name">
                Hapus preferensi
                <span className="storage-note">Tema, opsi formatter/diff, dan daftar tool terakhir.</span>
              </span>
              <Button
                onClick={() => void run("preferences", clearAppPreferences)}
                aria-label="Hapus preferensi"
                disabled={busy !== null || (report?.local.length ?? 0) + (report?.session.length ?? 0) === 0}
              >
                Hapus
              </Button>
            </li>
            <li className="storage-row">
              <span className="storage-name">
                Hapus cache offline
                <span className="storage-note">Aset build yang tersimpan agar situs tetap terbuka tanpa jaringan.</span>
              </span>
              <Button
                onClick={() => void run("caches", clearCacheStorage)}
                aria-label="Hapus cache offline"
                disabled={busy !== null || (report?.caches.length ?? 0) === 0}
              >
                Hapus
              </Button>
            </li>
            <li className="storage-row">
              <span className="storage-name">
                Lepas service worker
                <span className="storage-note">Berguna bila situs terasa menyajikan versi lama.</span>
              </span>
              <Button
                onClick={() => void run("worker", unregisterServiceWorker)}
                aria-label="Lepas service worker"
                disabled={busy !== null}
              >
                Lepas
              </Button>
            </li>
          </ul>
        </Panel>
      </div>

      <p className="hint-text hint-text--tight">
        Menghapus data tidak menghapus berkas yang sudah Anda unduh, dan tidak memengaruhi tab lain
        yang sedang terbuka.
      </p>
    </>
  );
}

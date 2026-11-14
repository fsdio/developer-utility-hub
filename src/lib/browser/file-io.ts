/**
 * Akses berkas di layer browser (bukan engine): membaca `File` menjadi byte dan
 * mengunduh byte menjadi berkas. Semua terjadi di perangkat pengguna — tidak ada
 * `fetch`, tidak ada upload (ADR-0017).
 */
import { MAX_FILE_BYTES } from "@/lib/encoding/file-base64";
import { err, ok, type Result } from "@/types/result";

export interface ReadFileResult {
  bytes: Uint8Array;
  name: string;
  /** MIME dari `File.type`; bisa kosong bila sistem tidak mengenalinya. */
  type: string;
}

const formatLimit = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(0)} MB`;

/** Membaca berkas ke memori, menolak berkas yang melewati batas. */
export async function readFileBytes(file: File): Promise<Result<ReadFileResult>> {
  if (file.size > MAX_FILE_BYTES) {
    return err({
      kind: "limit",
      message: `Berkas ${file.name} berukuran ${(file.size / (1024 * 1024)).toFixed(1)} MB, melebihi batas ${formatLimit(
        MAX_FILE_BYTES,
      )}.`,
    });
  }
  try {
    const buffer = await file.arrayBuffer();
    return ok({ bytes: new Uint8Array(buffer), name: file.name, type: file.type });
  } catch (cause) {
    return err({
      kind: "internal",
      message: `Gagal membaca berkas: ${cause instanceof Error ? cause.message : String(cause)}.`,
    });
  }
}

/** Unduh byte sebagai berkas; URL blob selalu di-revoke. */
export function downloadBytes(filename: string, bytes: Uint8Array, mime: string): boolean {
  if (typeof document === "undefined" || typeof URL === "undefined") return false;
  try {
    // Salin ke ArrayBuffer baru agar tipe `Uint8Array<ArrayBuffer>` terpenuhi.
    const blob = new Blob([bytes.slice().buffer], { type: mime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

/** Nama berkas dasar tanpa ekstensi, untuk menamai hasil konversi. */
export function baseNameOf(filename: string): string {
  const withoutPath = filename.split(/[\\/]/).pop() ?? filename;
  const dot = withoutPath.lastIndexOf(".");
  const base = dot > 0 ? withoutPath.slice(0, dot) : withoutPath;
  return base.replace(/[^\w.-]+/g, "-").slice(0, 60) || "berkas";
}

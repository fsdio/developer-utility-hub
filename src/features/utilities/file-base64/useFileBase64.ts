import { useCallback, useEffect, useMemo, useState } from "react";
import type { Base64Variant } from "@/lib/encoding/base64";
import { encodeBytesToBase64 } from "@/lib/encoding/base64";
import {
  base64ToBytes,
  decodedByteLength,
  detectFile,
  formatBytes,
  readBase64Source,
  type DetectedFile,
} from "@/lib/encoding/file-base64";
import { baseNameOf, downloadBytes, readFileBytes } from "@/lib/browser/file-io";
import type { ToolError } from "@/types/result";

export type FileBase64Direction = "encode" | "decode";

export interface LoadedFile {
  name: string;
  baseName: string;
  detected: DetectedFile;
  bytes: number;
  /** Base64 asli dari berkas (tanpa awalan data URL). */
  base64: string;
}

interface UseFileBase64Options {
  /** Membatasi jenis berkas yang diterima, mis. hanya gambar. */
  isAccepted?: (detected: DetectedFile) => boolean;
  /** Pesan bila berkas di luar cakupan tool. */
  rejectMessage: string;
}

/**
 * Logika bersama tool Gambar ⇄ Base64 dan PDF ⇄ Base64 (ADR-0017).
 *
 * - Arah `encode`: berkas → teks Base64 (berkas dibaca lokal, tidak diunggah).
 * - Arah `decode`: teks Base64 / data URL → byte + pratinjau + unduhan.
 *
 * Tidak ada `fetch` di mana pun: seluruh konversi berjalan di perangkat pengguna.
 */
export function useFileBase64({ isAccepted = () => true, rejectMessage }: UseFileBase64Options) {
  const [direction, setDirection] = useState<FileBase64Direction>("encode");
  const [source, setSource] = useState("");
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [error, setError] = useState<ToolError | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [variant, setVariant] = useState<Base64Variant>("standard");
  const [includeDataUrl, setIncludeDataUrl] = useState(false);

  /** Hasil parse teks di mode decode; `null` bila kosong. */
  const parsed = useMemo(() => {
    if (direction !== "decode" || source.trim() === "") return null;
    return readBase64Source(source);
  }, [direction, source]);

  /** Byte hasil decode — hanya dihitung sekali per teks, saat dibutuhkan. */
  const decodedBytes = useMemo(() => {
    if (!parsed?.ok) return null;
    return base64ToBytes(parsed.value.base64);
  }, [parsed]);

  const decodedDetected =
    parsed?.ok && isAccepted(parsed.value.detected) ? parsed.value.detected : null;

  /** Pratinjau memakai blob URL yang selalu di-revoke saat teks berubah. */
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (direction !== "decode" || !decodedBytes?.ok || !decodedDetected) {
      setPreviewUrl(null);
      return;
    }
    const blob = new Blob([decodedBytes.value.slice().buffer], { type: decodedDetected.mime });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    // Konfirmasi singkat: isi, ukuran, dan bahwa berkas siap diunduh.
    setStatus(
      `${decodedDetected.label} ${formatBytes(decodedBytes.value.length)} siap diunduh.`,
    );
    return () => URL.revokeObjectURL(url);
  }, [direction, decodedBytes, decodedDetected]);

  /** Teks yang ditampilkan di form: Base64, atau data URL lengkap bila diminta. */
  const displayText = useMemo(() => {
    if (direction === "encode" && includeDataUrl && file) {
      return `data:${file.detected.mime};base64,${source}`;
    }
    return source;
  }, [direction, includeDataUrl, file, source]);

  const loadFile = useCallback(
    async (selected: File): Promise<void> => {
      setError(null);
      setStatus(null);
      const read = await readFileBytes(selected);
      if (!read.ok) {
        setError(read.error);
        return;
      }
      const detected = detectFile(read.value.bytes);
      if (!isAccepted(detected)) {
        setError({
          kind: "validation",
          message: `${rejectMessage} Terdeteksi: ${detected.label}.`,
        });
        setFile(null);
        setSource("");
        return;
      }
      const encoded = encodeBytesToBase64(read.value.bytes, { variant });
      if (!encoded.ok) {
        setError(encoded.error);
        return;
      }
      setFile({
        name: read.value.name,
        baseName: baseNameOf(read.value.name),
        detected,
        bytes: read.value.bytes.length,
        base64: encoded.value,
      });
      setSource(encoded.value);
      setStatus(
        `${detected.label} ${formatBytes(read.value.bytes.length)} → ${formatBytes(encoded.value.length)} teks Base64.`,
      );
    },
    [isAccepted, rejectMessage, variant],
  );

  const downloadDecoded = useCallback((): void => {
    if (!parsed?.ok || !decodedBytes?.ok || !decodedDetected) return;
    const name = `${file?.baseName ?? "berkas"}.${decodedDetected.extension}`;
    const ok = downloadBytes(name, decodedBytes.value, decodedDetected.mime);
    setStatus(ok ? `${name} diunduh.` : "Unduhan diblokir browser.");
  }, [decodedBytes, decodedDetected, file, parsed]);

  const reset = useCallback(() => {
    setSource("");
    setFile(null);
    setError(null);
    setStatus(null);
  }, []);

  /** Pindah arah: hasil Base64 ikut terbawa agar bisa langsung di-decode balik. */
  const switchDirection = useCallback((next: FileBase64Direction) => {
    setDirection(next);
    setError(null);
    setStatus(null);
  }, []);

  return {
    direction,
    switchDirection,
    source,
    setSource,
    displayText,
    file,
    error,
    setError,
    status,
    setStatus,
    variant,
    setVariant,
    includeDataUrl,
    setIncludeDataUrl,
    loadFile,
    parsed,
    decodedBytes,
    decodedDetected,
    decodedSize: decodedDetected ? (decodedBytes?.ok ? decodedBytes.value.length : 0) : decodedByteLength(source),
    previewUrl,
    downloadDecoded,
    reset,
  };
}

import { useMemo } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { FileDropZone } from "@/components/common/FileDropZone";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { Button } from "@/components/common/Button";
import { CheckboxField, SelectField } from "@/components/common/Field";
import { ErrorMessage, StatusMessage } from "@/components/common/StatusMessage";
import type { ToolMeta } from "@/registry/tools";
import { formatBytes, type DetectedFile } from "@/lib/encoding/file-base64";
import { useFileBase64 } from "@/features/utilities/file-base64/useFileBase64";

interface FileBase64ViewProps {
  tool: ToolMeta;
  accept: string;
  formats: string;
  fileLabel: string;
  /** Membatasi jenis berkas; `false` menghasilkan pesan `rejectMessage`. */
  isAccepted: (detected: DetectedFile) => boolean;
  rejectMessage: string;
  /** Pratinjau di mode decode (gambar / PDF). */
  renderPreview: (url: string, detected: DetectedFile) => React.ReactNode;
  /** Teks bantuan di bawah panel saat belum ada apa pun. */
  emptyHint: string;
}

/**
 * Kerangka bersama dua tool berkas (ADR-0017):
 * `Gambar ⇄ Base64` dan `PDF ⇄ Base64`.
 *
 * Arah Encode: pilih/jatuhkan berkas → teks Base64 muncul di form.
 * Arah Decode: tempel Base64 atau data URL → berkasnya bisa dipratinjau & diunduh.
 * Tidak ada unggahan: semua dibaca dari disk pengguna.
 */
export function FileBase64View({
  tool,
  accept,
  formats,
  fileLabel,
  isAccepted,
  rejectMessage,
  renderPreview,
  emptyHint,
}: FileBase64ViewProps) {
  const state = useFileBase64({ isAccepted, rejectMessage });
  const {
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
    decodedSize,
    previewUrl,
    downloadDecoded,
    reset,
  } = state;

  /**
   * Kesalahan yang tampil di halaman. Selain error dari state, Base64 yang sah
   * tetapi jenisnya tidak cocok dengan tool ini (mis. PDF di tool gambar) juga
   * dilaporkan langsung — tanpa tombol tambahan, karena isinya sudah terlihat
   * di form.
   */
  const textError = useMemo(() => {
    if (direction === "encode") return error;
    if (!parsed) return error;
    if (!parsed.ok) return parsed.error;
    if (!isAccepted(parsed.value.detected)) {
      return {
        kind: "validation" as const,
        message: `${rejectMessage} Terdeteksi: ${parsed.value.detected.label}.`,
      };
    }
    return error;
  }, [direction, error, isAccepted, parsed, rejectMessage]);

  const info = direction === "encode" ? file?.detected : (decodedDetected ?? undefined);
  const encodeFooter = file
    ? `${file.detected.label} · ${formatBytes(file.bytes)} · Base64 ${formatBytes(source.length)}`
    : "belum ada berkas";

  const decodeFooter = decodedBytes?.ok
    ? `${decodedDetected?.label ?? "Berkas"} · ${formatBytes(decodedBytes.value.length)}`
    : "belum ada Base64";

  const canDownload = direction === "decode" && Boolean(decodedDetected && decodedBytes?.ok);

  return (
    <ToolLayout
      tool={tool}
      toolbar={
        <>
          <div className="action-group" role="group" aria-label="Arah konversi">
            <Button
              variant={direction === "encode" ? "primary" : "default"}
              onClick={() => switchDirection("encode")}
              aria-pressed={direction === "encode"}
            >
              Berkas → Base64
            </Button>
            <Button
              variant={direction === "decode" ? "primary" : "default"}
              onClick={() => switchDirection("decode")}
              aria-pressed={direction === "decode"}
            >
              Base64 → Berkas
            </Button>
          </div>
          <SelectField
            id="file-base64-variant"
            label="Varian"
            value={variant}
            options={[
              { value: "standard", label: "Standar (+ /)" },
              { value: "urlsafe", label: "URL-safe (- _)" },
            ]}
            onChange={setVariant}
          />
          {direction === "encode" ? (
            <CheckboxField
              id="file-base64-dataurl"
              label="Sertakan data URL"
              checked={includeDataUrl}
              onChange={setIncludeDataUrl}
            />
          ) : null}
          <span className="toolbar-spacer" />
          <CopyButton text={displayText} context={direction === "encode" ? "Base64" : "Base64 sumber"} />
          {direction === "decode" ? (
            <Button onClick={downloadDecoded} disabled={!canDownload}>
              Unduh berkas
            </Button>
          ) : null}
          <ResetButton onReset={reset} disabled={displayText === ""} />
        </>
      }
    >
      <div className={direction === "encode" ? "tool-panels tool-panels--stack" : "tool-grid"}>
        {direction === "encode" ? (
          <Panel
            label="Berkas"
            footer={
              file ? `${file.name} · ${formatBytes(file.bytes)}` : `${formats} · maks 20 MB`
            }
          >
            <FileDropZone
              label={fileLabel}
              accept={accept}
              formats={formats}
              onFile={(selected) => void loadFile(selected)}
            />
          </Panel>
        ) : null}

        <Panel
          label={direction === "encode" ? "Base64" : "Base64 / data URL"}
          tone={textError ? "error" : "default"}
          footer={direction === "encode" ? encodeFooter : decodeFooter}
        >
          <CodeArea
            label={direction === "encode" ? "Base64 hasil konversi" : "Base64 yang akan diubah menjadi berkas"}
            value={displayText}
            onChange={(value) => {
              setSource(value);
              setError(null);
              setStatus(null);
            }}
            placeholder={
              direction === "encode"
                ? "Pilih berkas — hasil Base64 muncul di sini"
                : `data:${info?.mime ?? "image/png"};base64,…`
            }
            hint="Semua konversi terjadi di perangkat Anda; berkas tidak pernah diunggah."
            error={Boolean(textError)}
            rows={12}
            readOnly={direction === "encode"}
          />
        </Panel>

        {direction === "decode" ? (
          <Panel
            label="Pratinjau"
            footer={
              decodedDetected
                ? `${info?.label ?? "Berkas"} · ${formatBytes(decodedSize)}`
                : "menunggu Base64 yang valid"
            }
          >
            {previewUrl && decodedDetected ? (
              renderPreview(previewUrl, decodedDetected)
            ) : (
              <p className="hint-text hint-text--tight file-preview-empty">
                Tempel Base64 atau data URL di panel kiri untuk melihat pratinjau dan
                mengunduh berkasnya.
              </p>
            )}
          </Panel>
        ) : null}
      </div>

      {status && !textError ? (
        <div className="result-block">
          <StatusMessage tone="success">{status}</StatusMessage>
        </div>
      ) : null}

      {textError ? (
        <div className="result-block">
          <ErrorMessage error={textError} />
        </div>
      ) : null}

      {displayText === "" ? (
        <p className="hint-text hint-text--tight">{emptyHint}</p>
      ) : null}
    </ToolLayout>
  );
}

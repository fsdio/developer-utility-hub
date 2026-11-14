import { FileBase64View } from "@/features/utilities/file-base64/FileBase64View";
import type { DetectedFile } from "@/lib/encoding/file-base64";
import { getTool } from "@/registry/tools";

const TOOL = getTool("pdf-base64")!;

const isPdf = (detected: DetectedFile): boolean => detected.kind === "pdf";

/**
 * PDF ⇄ Base64 (ADR-0017). Pratinjau memakai `<object>`: PDF dirender penampil
 * bawaan browser, tanpa library tambahan.
 */
export default function PdfBase64Page() {
  return (
    <FileBase64View
      tool={TOOL}
      accept="application/pdf"
      formats="PDF"
      fileLabel="Berkas PDF"
      isAccepted={isPdf}
      rejectMessage="Berkas ini bukan PDF."
      emptyHint="Pilih PDF untuk mendapatkan Base64-nya, atau tempel Base64/data URL PDF untuk mengunduh berkasnya kembali. Dokumen tidak pernah diunggah."
      renderPreview={(url) => (
        <object className="file-preview file-preview--pdf" data={url} type="application/pdf">
          <p className="hint-text hint-text--tight">
            Browser ini tidak menampilkan PDF di dalam halaman. Berkasnya tetap bisa diunduh
            lewat tombol <strong>Unduh berkas</strong>.
          </p>
        </object>
      )}
    />
  );
}

import { FileBase64View } from "@/features/utilities/file-base64/FileBase64View";
import type { DetectedFile } from "@/lib/encoding/file-base64";
import { getTool } from "@/registry/tools";

const TOOL = getTool("image-base64")!;

const isImage = (detected: DetectedFile): boolean => detected.kind === "image";

/**
 * Gambar ⇄ Base64 (ADR-0017). Menolak berkas non-gambar walau dipilih lewat
 * drag & drop: jenis ditentukan dari magic bytes, bukan nama berkas.
 */
export default function ImageBase64Page() {
  return (
    <FileBase64View
      tool={TOOL}
      accept="image/*"
      formats="PNG, JPEG, GIF, WEBP, SVG, BMP, AVIF"
      fileLabel="Berkas gambar"
      isAccepted={isImage}
      rejectMessage="Berkas ini bukan gambar yang didukung."
      emptyHint="Pilih gambar untuk mendapatkan Base64-nya, atau tempel Base64/data URL gambar untuk mengunduh berkasnya kembali. Tidak ada berkas yang diunggah."
      renderPreview={(url, detected) => (
        <img className="file-preview" src={url} alt={`Pratinjau ${detected.label}`} />
      )}
    />
  );
}

import { useId, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/common/Button";
import { MAX_FILE_BYTES, formatBytes } from "@/lib/encoding/file-base64";

interface FileDropZoneProps {
  /** Label untuk pembaca layar (mis. "Berkas gambar"). */
  label: string;
  /** Awalan `accept` untuk pemilih berkas, mis. "image/*" atau "application/pdf". */
  accept: string;
  /** Keterangan singkat yang terlihat, mis. "PNG, JPEG, GIF, WEBP, SVG". */
  formats: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}

/**
 * Pemilih berkas + area jatuhkan (drag & drop).
 *
 * Berkas tidak pernah diunggah: `onFile` menerima objek `File` yang dibaca
 * langsung di perangkat pengguna (ADR-0017). Area ini menggantikan input teks
 * sebagai jalur utama untuk data biner, karena Base64 gambar/PDF tidak masuk
 * akal untuk diketik.
 */
export function FileDropZone({ label, accept, formats, onFile, disabled }: FileDropZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  const handleFiles = (files: FileList | null): void => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setRejected(`Berkas ${formatBytes(file.size)} melebihi batas ${formatBytes(MAX_FILE_BYTES)}.`);
      return;
    }
    setRejected(null);
    onFile(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="file-drop-wrap">
      <div
        className={`file-drop${dragging ? " file-drop--active" : ""}${disabled ? " file-drop--disabled" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <label className="sr-only" htmlFor={inputId}>
          {label}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className="sr-only"
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(event) => {
            handleFiles(event.target.files);
            // Reset agar berkas yang sama bisa dipilih lagi.
            event.target.value = "";
          }}
        />
        <p className="file-drop-hint">Jatuhkan berkas di sini, atau</p>
        <Button onClick={() => inputRef.current?.click()} disabled={disabled}>
          Pilih berkas
        </Button>
        <p className="file-drop-formats">{formats} · maks {formatBytes(MAX_FILE_BYTES)}</p>
      </div>
      {rejected ? (
        <p className="hint-text hint-text--tight" role="alert">
          {rejected}
        </p>
      ) : null}
    </div>
  );
}

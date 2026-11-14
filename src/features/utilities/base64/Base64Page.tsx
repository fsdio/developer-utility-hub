import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { DownloadButton } from "@/components/common/DownloadButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/common/Button";
import { CheckboxField, SelectField } from "@/components/common/Field";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { decodeBase64, encodeBase64, type Base64Variant } from "@/lib/encoding/base64";
import { getTool } from "@/registry/tools";

const TOOL = getTool("base64")!;

const VARIANTS = [
  { value: "standard", label: "Standar (+ /)" },
  { value: "urlsafe", label: "URL-safe (- _)" },
] as const;

/**
 * Satu form, satu aksi (ADR-0014): tombol Encode/Decode mengubah isi form itu
 * sendiri, jadi tidak ada panel hasil dan hanya ada satu tombol salin.
 */
export default function Base64Page() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [variant, setVariant] = useState<Base64Variant>("standard");
  const [wrap, setWrap] = useState(false);

  const overLimit = input.length > MAX_INPUT_LENGTH;
  const result = useMemo(() => {
    if (input.trim() === "" || overLimit) return null;
    return mode === "encode"
      ? encodeBase64(input, { variant, wrap })
      : decodeBase64(input, { variant });
  }, [input, mode, variant, wrap, overLimit]);

  const run = (next: "encode" | "decode"): void => {
    setMode(next);
    if (input.trim() === "") return;
    const outcome =
      next === "encode" ? encodeBase64(input, { variant, wrap }) : decodeBase64(input, { variant });
    // Hasil menggantikan isi form: pengguna bisa bolak-balik encode/decode
    // tanpa memindahkan teks secara manual.
    if (outcome.ok) setInput(outcome.value);
  };

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <div className="action-group" role="group" aria-label="Arah konversi">
            <Button
              variant={mode === "encode" ? "primary" : "default"}
              onClick={() => run("encode")}
              aria-pressed={mode === "encode"}
            >
              Encode
            </Button>
            <Button
              variant={mode === "decode" ? "primary" : "default"}
              onClick={() => run("decode")}
              aria-pressed={mode === "decode"}
            >
              Decode
            </Button>
          </div>
          <SelectField
            id="base64-variant"
            label="Varian"
            value={variant}
            options={VARIANTS}
            onChange={setVariant}
          />
          {mode === "encode" ? (
            <CheckboxField
              id="base64-wrap"
              label="Bungkus 76 karakter"
              checked={wrap}
              onChange={setWrap}
            />
          ) : null}
          <span className="toolbar-spacer" />
          <CopyButton text={input} context="teks" />
          <DownloadButton text={input} baseName="base64" extension="txt" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label={mode === "encode" ? "Teks" : "Base64"}
        tone={result && !result.ok ? "error" : "default"}
        footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter · UTF-8`}
      >
        {overLimit ? (
          <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
        ) : (
          <CodeArea
            label={mode === "encode" ? "Teks yang akan di-encode" : "Base64 yang akan di-decode"}
            value={input}
            onChange={setInput}
            placeholder={mode === "encode" ? "café ☕" : "Y2Fmw6kg4piV"}
            hint="Tekan Encode atau Decode; hasilnya menggantikan isi form. Base64 memakai UTF-8."
            error={Boolean(result && !result.ok)}
            rows={14}
          />
        )}
      </Panel>

      {result && !result.ok ? (
        <div className="result-block">
          <ErrorMessage error={result.error} />
        </div>
      ) : null}
    </ToolLayout>
  );
}

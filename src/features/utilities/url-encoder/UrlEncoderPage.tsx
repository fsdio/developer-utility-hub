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
import { decodeUrl, encodeUrl, type UrlMode } from "@/lib/encoding/url";
import { getTool } from "@/registry/tools";

const TOOL = getTool("url-encoder")!;

const MODES = [
  { value: "component", label: "Komponen (%20)" },
  { value: "form", label: "Form (+)" },
] as const;

/** Satu form, satu aksi (ADR-0014): Encode/Decode mengubah isi form itu sendiri. */
export default function UrlEncoderPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlMode, setUrlMode] = useState<UrlMode>("component");
  const [plusAsSpace, setPlusAsSpace] = useState(false);

  const overLimit = input.length > MAX_INPUT_LENGTH;
  const result = useMemo(() => {
    if (input.trim() === "" || overLimit) return null;
    return mode === "encode" ? encodeUrl(input, urlMode) : decodeUrl(input, { plusAsSpace });
  }, [input, mode, urlMode, plusAsSpace, overLimit]);

  const run = (next: "encode" | "decode"): void => {
    setMode(next);
    if (input.trim() === "") return;
    const outcome =
      next === "encode" ? encodeUrl(input, urlMode) : decodeUrl(input, { plusAsSpace });
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
          {mode === "encode" ? (
            <SelectField id="url-mode" label="Gaya" value={urlMode} options={MODES} onChange={setUrlMode} />
          ) : (
            <CheckboxField
              id="url-plus"
              label="+ jadi spasi"
              checked={plusAsSpace}
              onChange={setPlusAsSpace}
            />
          )}
          <span className="toolbar-spacer" />
          <CopyButton text={input} context="teks" />
          <DownloadButton text={input} baseName="url-encoder" extension="txt" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label={mode === "encode" ? "Teks / URL" : "Teks ter-encode"}
        tone={result && !result.ok ? "error" : "default"}
        footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
      >
        {overLimit ? (
          <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
        ) : (
          <CodeArea
            label={
              mode === "encode"
                ? "Teks atau URL yang akan di-encode"
                : "Teks ter-encode yang akan di-decode"
            }
            value={input}
            onChange={setInput}
            placeholder={mode === "encode" ? "cari?q=satu dua&x=1" : "cari%3Fq%3Dsatu%20dua%26x%3D1"}
            hint="Tekan Encode atau Decode; hasilnya menggantikan isi form. encodeURIComponent meng-encode semua karakter kecuali A–Z a–z 0–9 - _ . ! ~ * ' ( )."
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

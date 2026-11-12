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

  const output = result?.ok ? result.value : "";
  const swap = (): void => {
    if (result?.ok) setInput(result.value);
    setMode(mode === "encode" ? "decode" : "encode");
  };

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <Button variant={mode === "encode" ? "primary" : "default"} onClick={() => setMode("encode")} aria-pressed={mode === "encode"}>
            Encode
          </Button>
          <Button variant={mode === "decode" ? "primary" : "default"} onClick={() => setMode("decode")} aria-pressed={mode === "decode"}>
            Decode
          </Button>
          <SelectField
            id="base64-variant"
            label="Varian"
            value={variant}
            options={VARIANTS}
            onChange={setVariant}
          />
          {mode === "encode" ? (
            <CheckboxField id="base64-wrap" label="Bungkus 76 karakter" checked={wrap} onChange={setWrap} />
          ) : null}
          <span className="toolbar-spacer" />
          <Button onClick={swap} disabled={!result?.ok}>
            Tukar ke {mode === "encode" ? "decode" : "encode"}
          </Button>
          <CopyButton text={output} />
          <DownloadButton text={output} baseName="base64" extension="txt" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <div className="tool-grid">
        <Panel
          label={mode === "encode" ? "Teks input" : "Base64 input"}
          tone={result && !result.ok ? "error" : "default"}
          footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter · UTF-8`}
        >
          <CodeArea
            label={mode === "encode" ? "Teks yang akan di-encode" : "Base64 yang akan di-decode"}
            value={input}
            onChange={setInput}
            placeholder={mode === "encode" ? "café ☕" : "Y2Fmw6kg4piV"}
            hint="Base64 memakai UTF-8, sehingga karakter non-ASCII aman."
            error={Boolean(result && !result.ok)}
          />
        </Panel>

        <Panel label="Hasil">
          {overLimit ? (
            <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
          ) : result === null ? (
            <EmptyState example={{ label: "Coba contoh", onUse: () => setInput("café ☕") }}>
              Base64 mengubah data biner menjadi teks ASCII. Pilih Encode atau Decode.
            </EmptyState>
          ) : result.ok ? (
            <pre className="output-area output-area--wrap">{result.value}</pre>
          ) : (
            <EmptyState>Perbaiki error untuk melihat hasil.</EmptyState>
          )}
        </Panel>
      </div>

      {result && !result.ok ? (
        <div className="result-block">
          <ErrorMessage error={result.error} />
        </div>
      ) : null}
    </ToolLayout>
  );
}

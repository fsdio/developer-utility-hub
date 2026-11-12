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
import { SelectField } from "@/components/common/Field";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { formatJson, minifyJson, validateJson, type JsonIndent } from "@/lib/json/format";
import { getTool } from "@/registry/tools";
import { useLocalStoragePreference } from "@/hooks/useLocalStoragePreference";
import { PREFERENCE_KEYS } from "@/lib/browser/storage";

const TOOL = getTool("json-formatter")!;

const EXAMPLE = `{"name":"devkit","tools":[{"id":"json","stable":true}],"meta":{"version":2}}`;

const isIndent = (value: string): value is `${JsonIndent}` =>
  value === "2" || value === "4" || value === "tab";

const INDENT_OPTIONS = [
  { value: "2", label: "2 spasi" },
  { value: "4", label: "4 spasi" },
  { value: "tab", label: "Tab" },
] as const;

type Action = "format" | "minify" | "validate";

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [action, setAction] = useState<Action>("format");
  const [indentRaw, setIndentRaw] = useLocalStoragePreference<string>(
    PREFERENCE_KEYS.jsonIndent,
    "2",
    isIndent,
  );

  const indent: JsonIndent = indentRaw === "tab" ? "tab" : indentRaw === "4" ? 4 : 2;
  const overLimit = input.length > MAX_INPUT_LENGTH;

  const result = useMemo(() => {
    if (input.trim() === "" || overLimit) return null;
    if (action === "format") return formatJson(input, indent);
    if (action === "minify") return minifyJson(input);
    return validateJson(input);
  }, [input, action, indent, overLimit]);

  const output = (() => {
    if (!result?.ok) return "";
    if ("text" in result.value) return result.value.text;
    const stats = result.value;
    return [
      "JSON valid.",
      `Tipe root: ${stats.rootType}`,
      `Jumlah key: ${stats.keys}`,
      `Kedalaman maksimum: ${stats.maxDepth}`,
    ].join("\n");
  })();

  const reset = (): void => setInput("");

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <Button variant="primary" onClick={() => setAction("format")} aria-pressed={action === "format"}>
            Format
          </Button>
          <Button onClick={() => setAction("minify")} aria-pressed={action === "minify"}>
            Minify
          </Button>
          <Button onClick={() => setAction("validate")} aria-pressed={action === "validate"}>
            Validasi
          </Button>
          <SelectField
            id="json-indent"
            label="Indent"
            value={indentRaw}
            options={INDENT_OPTIONS}
            onChange={setIndentRaw}
          />
          <span className="toolbar-spacer" />
          <CopyButton text={output} />
          <DownloadButton text={output} baseName="json-formatter" extension="json" mime="application/json" />
          <ResetButton onReset={reset} disabled={input === ""} />
        </>
      }
    >
      <div className="tool-grid">
        <Panel
          label="Input JSON"
          tone={result && !result.ok ? "error" : "default"}
          footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
        >
          <CodeArea
            label="JSON sumber"
            value={input}
            onChange={setInput}
            placeholder='{"hello": "world"}'
            hint="Tempel JSON; format, minify, atau validasi sesuai tombol yang aktif."
            error={Boolean(result && !result.ok)}
          />
        </Panel>

        <Panel label={action === "validate" ? "Ringkasan validasi" : "Hasil"}>
          {overLimit ? (
            <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
          ) : result === null ? (
            <EmptyState example={{ label: "Coba contoh JSON", onUse: () => setInput(EXAMPLE) }}>
              Tempel JSON untuk memformat, meminify, atau memvalidasi.
            </EmptyState>
          ) : result.ok ? (
            <pre className="output-area">{output}</pre>
          ) : (
            <EmptyState>Perbaiki error di input untuk melihat hasil.</EmptyState>
          )}
        </Panel>
      </div>

      {result && !result.ok ? <div className="result-block"><ErrorMessage error={result.error} /></div> : null}
    </ToolLayout>
  );
}

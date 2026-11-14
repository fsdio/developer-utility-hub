import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { InlineResult } from "@/components/editor/InlineResult";
import { CopyButton } from "@/components/common/CopyButton";
import { DownloadButton } from "@/components/common/DownloadButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/common/Button";
import { SelectField } from "@/components/common/Field";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { formatJson, minifyJson, validateJson, type JsonIndent } from "@/lib/json/format";
import {
  escapeForFormatter,
  unescapeForFormatter,
  type FormatterEscapeTarget,
} from "@/lib/encoding/escape";
import { getTool } from "@/registry/tools";
import { useLocalStoragePreference } from "@/hooks/useLocalStoragePreference";
import { PREFERENCE_KEYS } from "@/lib/browser/storage";

const TOOL = getTool("json-formatter")!;

const EXAMPLE = `{"name":"devkit","tools":[{"id":"json","stable":true}],"meta":{"version":2}}`;
const EXAMPLE_RAW = `Baris satu
Baris "dua" & <tiga>`;

const isIndent = (value: string): value is `${JsonIndent}` =>
  value === "2" || value === "4" || value === "tab";

const INDENT_OPTIONS = [
  { value: "2", label: "2 spasi" },
  { value: "4", label: "4 spasi" },
  { value: "tab", label: "Tab" },
] as const;

const ESCAPE_OPTIONS: ReadonlyArray<{ value: FormatterEscapeTarget; label: string }> = [
  { value: "json-string", label: "Isi string" },
  { value: "json-document", label: "Dokumen JSON" },
];

type Action = "format" | "minify" | "validate" | "escape" | "unescape";

const ACTION_LABEL: Record<Action, string> = {
  format: "Format",
  minify: "Minify",
  validate: "Validasi",
  escape: "Escape",
  unescape: "Unescape",
};

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [action, setAction] = useState<Action>("format");
  const [escapeTarget, setEscapeTarget] = useState<FormatterEscapeTarget>("json-string");
  const [indentRaw, setIndentRaw] = useLocalStoragePreference<string>(
    PREFERENCE_KEYS.jsonIndent,
    "2",
    isIndent,
  );

  const indent: JsonIndent = indentRaw === "tab" ? "tab" : indentRaw === "4" ? 4 : 2;
  const overLimit = input.length > MAX_INPUT_LENGTH;
  const escaping = action === "escape" || action === "unescape";

  const result = useMemo(() => {
    if (input.trim() === "" || overLimit) return null;
    if (action === "format") return formatJson(input, indent);
    if (action === "minify") return minifyJson(input);
    if (action === "validate") return validateJson(input);
    if (action === "escape") {
      return { ok: true as const, value: { text: escapeForFormatter(input, escapeTarget) } };
    }
    const unescaped = unescapeForFormatter(input, escapeTarget);
    return unescaped.ok
      ? { ok: true as const, value: { text: unescaped.value } }
      : unescaped;
  }, [input, action, indent, escapeTarget, overLimit]);

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
          <div className="action-group" role="group" aria-label="Aksi">
            <Button variant="primary" onClick={() => setAction("format")} aria-pressed={action === "format"}>
              Format
            </Button>
            <Button onClick={() => setAction("minify")} aria-pressed={action === "minify"}>
              Minify
            </Button>
            <Button onClick={() => setAction("validate")} aria-pressed={action === "validate"}>
              Validasi
            </Button>
            <Button onClick={() => setAction("escape")} aria-pressed={action === "escape"}>
              Escape
            </Button>
            <Button onClick={() => setAction("unescape")} aria-pressed={action === "unescape"}>
              Unescape
            </Button>
          </div>
          {escaping ? (
            <SelectField
              id="json-escape-target"
              label="Bentuk escape"
              value={escapeTarget}
              options={ESCAPE_OPTIONS}
              onChange={setEscapeTarget}
            />
          ) : (
            <SelectField
              id="json-indent"
              label="Indent"
              value={indentRaw}
              options={INDENT_OPTIONS}
              onChange={setIndentRaw}
            />
          )}
          <span className="toolbar-spacer" />
          <DownloadButton
            text={output}
            baseName="json-formatter"
            extension="json"
            mime="application/json"
          />
          <ResetButton onReset={reset} disabled={input === ""} />
        </>
      }
    >
      {/* Satu panel: input dan hasilnya berada dalam blok pandang yang sama. */}
      <Panel
        label="Input JSON"
        stacked
        tone={result && !result.ok ? "error" : "default"}
        footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
      >
        <CodeArea
          label="JSON sumber"
          value={input}
          onChange={setInput}
          placeholder={escaping ? "Tempel teks mentah atau escape yang akan diubah" : '{"hello": "world"}'}
          hint="Tempel JSON; format, minify, validasi, atau escape sesuai tombol yang aktif."
          error={Boolean(result && !result.ok)}
        />
        <InlineResult
          label={`Hasil ${ACTION_LABEL[action]}`}
          tone={result && !result.ok ? "error" : "default"}
          actions={<CopyButton text={output} label="Copy" compact context="hasil" />}
        >
          {overLimit ? (
            <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
          ) : result === null ? (
            <EmptyState
              example={{
                label: escaping ? "Coba teks contoh" : "Coba contoh JSON",
                onUse: () => setInput(escaping ? EXAMPLE_RAW : EXAMPLE),
              }}
            >
              {escaping
                ? "Tempel teks untuk melihat bentuk escape-nya, atau escape untuk mengembalikan teks asli."
                : "Tempel JSON untuk memformat, meminify, atau memvalidasi."}
            </EmptyState>
          ) : result.ok ? (
            <pre className="output-area output-area--wrap">{output}</pre>
          ) : (
            <ErrorMessage error={result.error} />
          )}
        </InlineResult>
      </Panel>
    </ToolLayout>
  );
}

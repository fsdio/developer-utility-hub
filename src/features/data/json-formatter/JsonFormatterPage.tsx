import { useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { DownloadButton } from "@/components/common/DownloadButton";
import { ResetButton } from "@/components/common/ResetButton";
import { Button } from "@/components/common/Button";
import { SelectField } from "@/components/common/Field";
import { ErrorMessage, StatusMessage } from "@/components/common/StatusMessage";
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
import type { ToolError } from "@/types/result";

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

/**
 * Formatter bekerja pada isi form, bukan panel hasil (ADR-0015).
 *
 * Menekan Format/Minify/Escape/Unescape **menggantikan teks di textarea**, jadi
 * hasilnya langsung bisa disunting di tempat yang sama. Validasi tidak mengubah
 * teks; ia hanya melaporkan ringkasan/kesalahan sebagai satu baris status.
 */
export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [action, setAction] = useState<Action>("format");
  const [escapeTarget, setEscapeTarget] = useState<FormatterEscapeTarget>("json-string");
  const [error, setError] = useState<ToolError | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [indentRaw, setIndentRaw] = useLocalStoragePreference<string>(
    PREFERENCE_KEYS.jsonIndent,
    "2",
    isIndent,
  );

  const indent: JsonIndent = indentRaw === "tab" ? "tab" : indentRaw === "4" ? 4 : 2;
  const overLimit = input.length > MAX_INPUT_LENGTH;
  const escaping = action === "escape" || action === "unescape";

  const run = (next: Action): void => {
    setAction(next);
    setStatus(null);
    setError(null);
    if (input.trim() === "" || overLimit) return;

    if (next === "validate") {
      const checked = validateJson(input);
      if (checked.ok) {
        setStatus(
          [
            "JSON valid.",
            `Tipe root: ${checked.value.rootType}`,
            `Jumlah key: ${checked.value.keys}`,
            `Kedalaman maksimum: ${checked.value.maxDepth}`,
          ].join(" · "),
        );
      } else {
        setError(checked.error);
      }
      return;
    }

    // Setiap aksi menghasilkan teks baru atau error; teks langsung dipakai
    // sebagai isi form sehingga aksi berikutnya bekerja pada hasil sebelumnya.
    if (next === "format") {
      const outcome = formatJson(input, indent);
      if (outcome.ok) setInput(outcome.value.text);
      else setError(outcome.error);
      return;
    }
    if (next === "minify") {
      const outcome = minifyJson(input);
      if (outcome.ok) setInput(outcome.value.text);
      else setError(outcome.error);
      return;
    }
    if (next === "escape") {
      setInput(escapeForFormatter(input, escapeTarget));
      return;
    }
    const outcome = unescapeForFormatter(input, escapeTarget);
    if (outcome.ok) setInput(outcome.value);
    else setError(outcome.error);
  };

  const useExample = (): void => {
    setInput(escaping ? EXAMPLE_RAW : EXAMPLE);
    setError(null);
    setStatus(null);
  };

  const reset = (): void => {
    setInput("");
    setError(null);
    setStatus(null);
  };

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <div className="action-group" role="group" aria-label="Aksi JSON">
            {(["format", "minify", "validate", "escape", "unescape"] as const).map((item) => (
              <Button
                key={item}
                variant={action === item ? "primary" : "default"}
                onClick={() => run(item)}
                aria-pressed={action === item}
              >
                {item === "format"
                  ? "Format"
                  : item === "minify"
                    ? "Minify"
                    : item === "validate"
                      ? "Validasi"
                      : item === "escape"
                        ? "Escape"
                        : "Unescape"}
              </Button>
            ))}
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
          <CopyButton text={input} context="JSON di form" />
          <DownloadButton
            text={input}
            baseName="json-formatter"
            extension="json"
            mime="application/json"
          />
          <ResetButton onReset={reset} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label="JSON"
        tone={error ? "error" : "default"}
        footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
      >
        <CodeArea
          label="JSON sumber"
          value={input}
          onChange={(value) => {
            setInput(value);
            setError(null);
            setStatus(null);
          }}
          placeholder={escaping ? "Tempel teks mentah atau escape yang akan diubah" : '{"hello": "world"}'}
          hint="Tekan Format, Minify, Escape, atau Unescape; hasilnya menggantikan isi form ini."
          error={Boolean(error)}
          rows={16}
          autoGrow
        />
      </Panel>

      {status ? (
        <div className="result-block">
          <StatusMessage tone="success">{status}</StatusMessage>
        </div>
      ) : null}

      {error ? (
        <div className="result-block">
          <ErrorMessage error={error} />
        </div>
      ) : null}

      {input.trim() === "" ? (
        <p className="hint-text hint-text--tight">
          Tempel JSON untuk memformat, meminify, memvalidasi, atau meng-escape.{" "}
          <button type="button" className="link-button" onClick={useExample}>
            {escaping ? "Coba teks contoh" : "Coba contoh JSON"}
          </button>
        </p>
      ) : null}

      {overLimit ? (
        <p className="hint-text hint-text--tight">
          Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.
        </p>
      ) : null}
    </ToolLayout>
  );
}

import { useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { DownloadButton } from "@/components/common/DownloadButton";
import { ResetButton } from "@/components/common/ResetButton";
import { ErrorMessage, StatusMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/common/Button";
import { CheckboxField, SelectField } from "@/components/common/Field";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { formatXml, minifyXml, validateXml, type XmlIndent } from "@/lib/xml/format";
import {
  escapeForFormatter,
  unescapeForFormatter,
  type FormatterEscapeTarget,
} from "@/lib/encoding/escape";
import type { ToolError } from "@/types/result";
import { getTool } from "@/registry/tools";
import { useLocalStoragePreference } from "@/hooks/useLocalStoragePreference";
import { PREFERENCE_KEYS } from "@/lib/browser/storage";

const TOOL = getTool("xml-formatter")!;

const EXAMPLE = `<?xml version="1.0"?>
<!-- contoh -->
<catalog><book id="1"><title>Belajar XML</title><author>Rani</author></book></catalog>`;

const isIndent = (value: string): value is `${XmlIndent}` =>
  value === "2" || value === "4" || value === "tab";

const INDENT_OPTIONS = [
  { value: "2", label: "2 spasi" },
  { value: "4", label: "4 spasi" },
  { value: "tab", label: "Tab" },
] as const;

interface XmlPrefs {
  indent: string;
  preserveComments: boolean;
}

const DEFAULT_PREFS: XmlPrefs = { indent: "2", preserveComments: true };

const parsePrefs = (raw: string | null): XmlPrefs => {
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      return {
        indent: typeof record.indent === "string" && isIndent(record.indent) ? record.indent : "2",
        preserveComments: record.preserveComments !== false,
      };
    }
  } catch {
    // abaikan, pakai default
  }
  return DEFAULT_PREFS;
};

type Action = "format" | "minify" | "validate" | "escape" | "unescape";

const ESCAPE_OPTIONS: ReadonlyArray<{ value: FormatterEscapeTarget; label: string }> = [
  { value: "xml-text", label: "Isi elemen/atribut" },
  { value: "xml-document", label: "Dokumen XML" },
];

const browserParse = (text: string): Document =>
  new DOMParser().parseFromString(text, "application/xml");

export default function XmlFormatterPage() {
  const [input, setInput] = useState("");
  const [action, setAction] = useState<Action>("format");
  const [escapeTarget, setEscapeTarget] = useState<FormatterEscapeTarget>("xml-text");
  const [error, setError] = useState<ToolError | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [prefsRaw, setPrefsRaw] = useLocalStoragePreference<string>(
    PREFERENCE_KEYS.xmlOptions,
    JSON.stringify(DEFAULT_PREFS),
    (value): value is string => typeof value === "string",
  );

  const prefs = parsePrefs(prefsRaw);
  const indent: XmlIndent = prefs.indent === "tab" ? "tab" : prefs.indent === "4" ? 4 : 2;
  const overLimit = input.length > MAX_INPUT_LENGTH;
  const escaping = action === "escape" || action === "unescape";

  const updatePrefs = (next: Partial<XmlPrefs>): void => {
    setPrefsRaw(JSON.stringify({ ...prefs, ...next }));
  };

  const run = (next: Action): void => {
    setAction(next);
    setError(null);
    setStatus(null);
    if (input.trim() === "" || overLimit) return;

    const options = { indent, preserveComments: prefs.preserveComments };

    if (next === "validate") {
      const checked = validateXml(input, browserParse);
      if (checked.ok) {
        setStatus(
          `XML valid secara well-formed · root <${checked.value.rootName}> · ${checked.value.elementCount} elemen`,
        );
      } else {
        setError(checked.error);
      }
      return;
    }

    if (next === "escape") {
      setInput(escapeForFormatter(input, escapeTarget));
      return;
    }

    if (next === "unescape") {
      const unescaped = unescapeForFormatter(input, escapeTarget);
      if (unescaped.ok) setInput(unescaped.value);
      else setError(unescaped.error);
      return;
    }

    const outcome =
      next === "format" ? formatXml(input, browserParse, options) : minifyXml(input, browserParse, options);
    if (outcome.ok) setInput(outcome.value.text);
    else setError(outcome.error);
  };

  const useExample = (): void => {
    setInput(escaping ? '<a href="x">Tom & Jerry</a>' : EXAMPLE);
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
          <div className="action-group" role="group" aria-label="Aksi">
            <Button variant="primary" onClick={() => run("format")} aria-pressed={action === "format"}>
              Format
            </Button>
            <Button onClick={() => run("minify")} aria-pressed={action === "minify"}>
              Minify
            </Button>
            <Button onClick={() => run("validate")} aria-pressed={action === "validate"}>
              Validasi struktur
            </Button>
            <Button onClick={() => run("escape")} aria-pressed={action === "escape"}>
              Escape
            </Button>
            <Button onClick={() => run("unescape")} aria-pressed={action === "unescape"}>
              Unescape
            </Button>
          </div>
          {escaping ? (
            <SelectField
              id="xml-escape-target"
              label="Bentuk escape"
              value={escapeTarget}
              options={ESCAPE_OPTIONS}
              onChange={setEscapeTarget}
            />
          ) : (
            <>
              <SelectField
                id="xml-indent"
                label="Indent"
                value={prefs.indent}
                options={INDENT_OPTIONS}
                onChange={(value) => updatePrefs({ indent: value })}
              />
              <CheckboxField
                id="xml-comments"
                label="Pertahankan komentar"
                checked={prefs.preserveComments}
                onChange={(checked) => updatePrefs({ preserveComments: checked })}
              />
            </>
          )}
          <span className="toolbar-spacer" />
          <CopyButton text={input} context="XML di form" />
          <DownloadButton text={input} baseName="xml-formatter" extension="xml" mime="application/xml" />
          <ResetButton onReset={reset} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label="XML"
        tone={error ? "error" : "default"}
        footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
      >
        <CodeArea
          label="XML sumber"
          value={input}
          onChange={(value) => {
            setInput(value);
            setError(null);
            setStatus(null);
          }}
          placeholder={escaping ? "Tempel teks atau XML yang akan di-escape" : "<root><item>nilai</item></root>"}
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
          Tempel XML untuk merapikan, meminify, atau memeriksa struktur.{" "}
          <button type="button" className="link-button" onClick={useExample}>
            {escaping ? "Coba teks contoh" : "Coba contoh XML"}
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

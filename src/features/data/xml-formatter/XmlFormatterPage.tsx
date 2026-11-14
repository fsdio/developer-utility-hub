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
import { formatXml, minifyXml, validateXml, type XmlIndent } from "@/lib/xml/format";
import {
  escapeForFormatter,
  unescapeForFormatter,
  type FormatterEscapeTarget,
} from "@/lib/encoding/escape";
import { InlineResult } from "@/components/editor/InlineResult";
import { ok, type Result } from "@/types/result";
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

type XmlOutcome =
  | { kind: "text"; text: string }
  | { kind: "info"; rootName: string; elementCount: number };

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

const ACTION_LABEL: Record<Action, string> = {
  format: "Format",
  minify: "Minify",
  validate: "Validasi",
  escape: "Escape",
  unescape: "Unescape",
};

const browserParse = (text: string): Document =>
  new DOMParser().parseFromString(text, "application/xml");

export default function XmlFormatterPage() {
  const [input, setInput] = useState("");
  const [action, setAction] = useState<Action>("format");
  const [escapeTarget, setEscapeTarget] = useState<FormatterEscapeTarget>("xml-text");
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

  const result = useMemo<Result<XmlOutcome> | null>(() => {
    if (input.trim() === "" || overLimit) return null;
    const options = { indent, preserveComments: prefs.preserveComments };

    if (action === "format") {
      const raw = formatXml(input, browserParse, options);
      return raw.ok ? ok<XmlOutcome>({ kind: "text", text: raw.value.text }) : raw;
    }
    if (action === "minify") {
      const raw = minifyXml(input, browserParse, options);
      return raw.ok ? ok<XmlOutcome>({ kind: "text", text: raw.value.text }) : raw;
    }
    if (action === "validate") {
      const raw = validateXml(input, browserParse);
      return raw.ok
        ? ok<XmlOutcome>({
            kind: "info",
            rootName: raw.value.rootName,
            elementCount: raw.value.elementCount,
          })
        : raw;
    }
    if (action === "escape") {
      return ok<XmlOutcome>({ kind: "text", text: escapeForFormatter(input, escapeTarget) });
    }
    const unescaped = unescapeForFormatter(input, escapeTarget);
    return unescaped.ok ? ok<XmlOutcome>({ kind: "text", text: unescaped.value }) : unescaped;
  }, [input, action, indent, prefs.preserveComments, escapeTarget, overLimit]);

  const output = (() => {
    if (!result?.ok) return "";
    const value = result.value;
    return value.kind === "text"
      ? value.text
      : [
          "XML valid secara well-formed.",
          `Root: <${value.rootName}>`,
          `Jumlah elemen: ${value.elementCount}`,
        ].join("\n");
  })();

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
              Validasi struktur
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
          <DownloadButton text={output} baseName="xml-formatter" extension="xml" mime="application/xml" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label="Input XML"
        stacked
        tone={result && !result.ok ? "error" : "default"}
        footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
      >
        <CodeArea
          label="XML sumber"
          value={input}
          onChange={setInput}
          placeholder={escaping ? "Tempel teks atau XML yang akan di-escape" : "<root><item>nilai</item></root>"}
          hint="Tempel XML; formatter mempertahankan komentar dan processing instruction bila opsi aktif."
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
                label: escaping ? "Coba teks contoh" : "Coba contoh XML",
                onUse: () => setInput(escaping ? '<a href="x">Tom & Jerry</a>' : EXAMPLE),
              }}
            >
              {escaping
                ? "Tempel teks agar karakter berbahaya diubah menjadi entitas XML, atau sebaliknya."
                : "Tempel XML untuk merapikan, meminify, atau memeriksa struktur."}
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

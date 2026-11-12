import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/common/Button";
import { SelectField } from "@/components/common/Field";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import {
  ESCAPE_TARGET_LABELS,
  ESCAPE_TARGETS,
  escapeString,
  unescapeString,
  type EscapeTarget,
} from "@/lib/encoding/escape";
import { getTool } from "@/registry/tools";

const TOOL = getTool("escape")!;

const TARGET_OPTIONS = ESCAPE_TARGETS.map((target) => ({
  value: target,
  label: ESCAPE_TARGET_LABELS[target],
}));

export default function EscapePage() {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<EscapeTarget>("json");
  const [mode, setMode] = useState<"escape" | "unescape">("escape");

  const overLimit = input.length > MAX_INPUT_LENGTH;
  const result = useMemo(() => {
    if (input === "" || overLimit) return null;
    if (mode === "escape") return { ok: true as const, value: escapeString(input, target) };
    return unescapeString(input, target);
  }, [input, target, mode, overLimit]);

  const output = result?.ok ? result.value : "";

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <Button variant={mode === "escape" ? "primary" : "default"} onClick={() => setMode("escape")} aria-pressed={mode === "escape"}>
            Escape
          </Button>
          <Button variant={mode === "unescape" ? "primary" : "default"} onClick={() => setMode("unescape")} aria-pressed={mode === "unescape"}>
            Unescape
          </Button>
          <SelectField id="escape-target" label="Konteks" value={target} options={TARGET_OPTIONS} onChange={setTarget} />
          <span className="toolbar-spacer" />
          <CopyButton text={output} />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <div className="tool-grid">
        <Panel
          label="Input"
          tone={result && !result.ok ? "error" : "default"}
          footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
        >
          <CodeArea
            label="Teks sumber"
            value={input}
            onChange={setInput}
            placeholder={mode === "escape" ? `Tom & Jerry's "kutip"` : `Tom &amp; Jerry&#39;s`}
            hint={`Konteks ${ESCAPE_TARGET_LABELS[target]}. Escape menghasilkan teks yang aman disisipkan ke konteks tersebut.`}
            error={Boolean(result && !result.ok)}
          />
        </Panel>

        <Panel label="Hasil">
          {overLimit ? (
            <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
          ) : result === null ? (
            <EmptyState example={{ label: "Coba contoh", onUse: () => setInput(`Tom & Jerry's "kutip"`) }}>
              Pilih konteks (JSON, JS, HTML, SQL, XML) lalu escape atau unescape.
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

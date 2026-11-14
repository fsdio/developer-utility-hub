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

  const run = (next: "escape" | "unescape"): void => {
    setMode(next);
    if (input === "" || overLimit) return;
    const outcome =
      next === "escape" ? { ok: true as const, value: escapeString(input, target) } : unescapeString(input, target);
    // Hasil menggantikan isi form: escape lalu unescape bisa dirangkai.
    if (outcome.ok) setInput(outcome.value);
  };

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <div className="action-group" role="group" aria-label="Arah escape">
            <Button
              variant={mode === "escape" ? "primary" : "default"}
              onClick={() => run("escape")}
              aria-pressed={mode === "escape"}
            >
              Escape
            </Button>
            <Button
              variant={mode === "unescape" ? "primary" : "default"}
              onClick={() => run("unescape")}
              aria-pressed={mode === "unescape"}
            >
              Unescape
            </Button>
          </div>
          <SelectField id="escape-target" label="Konteks" value={target} options={TARGET_OPTIONS} onChange={setTarget} />
          <span className="toolbar-spacer" />
          <CopyButton text={input} context="teks" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label={`Teks · ${ESCAPE_TARGET_LABELS[target]}`}
        tone={result && !result.ok ? "error" : "default"}
        footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
      >
        {overLimit ? (
          <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
        ) : (
          <CodeArea
            label="Teks sumber"
            value={input}
            onChange={setInput}
            placeholder={mode === "escape" ? `Tom & Jerry's "kutip"` : `Tom &amp; Jerry&#39;s`}
            hint={`Tekan Escape atau Unescape; hasilnya menggantikan isi form. Konteks ${ESCAPE_TARGET_LABELS[target]}.`}
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

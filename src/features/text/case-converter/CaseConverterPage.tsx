import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { CASE_STYLES, CASE_STYLE_LABELS, convertAll } from "@/lib/text/case";
import { getTool } from "@/registry/tools";

const TOOL = getTool("case-converter")!;

const EXAMPLE = "Hello, World! userID from HTTPResponse";

export default function CaseConverterPage() {
  const [input, setInput] = useState("");

  const overLimit = input.length > MAX_INPUT_LENGTH;
  const results = useMemo(() => {
    if (input.trim() === "" || overLimit) return null;
    return convertAll(input);
  }, [input, overLimit]);

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <span className="field">9 gaya sekaligus, tiap hasil punya tombol copy sendiri.</span>
          <span className="toolbar-spacer" />
          <ResetButton
            onReset={() => setInput("")}
            disabled={input === ""}
          />
        </>
      }
    >
      <div className="tool-grid">
        <Panel
          label="Input"
          tone={overLimit ? "error" : "default"}
          footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
        >
          <CodeArea
            label="Teks sumber"
            value={input}
            onChange={setInput}
            placeholder="Tempel teks di sini, mis. hello world"
            hint="Teks akan dikonversi ke sembilan gaya penulisan sekaligus."
          />
        </Panel>

        <Panel label="Hasil">
          {results === null ? (
            <EmptyState example={{ label: `Coba contoh: ${EXAMPLE}`, onUse: () => setInput(EXAMPLE) }}>
              {overLimit
                ? "Input melebihi 1.000.000 karakter. Perkecil input untuk memproses."
                : "Masukkan teks untuk melihat sembilan gaya penulisannya."}
            </EmptyState>
          ) : (
            <div className="case-list" style={{ padding: "var(--space-3)", width: "100%" }}>
              {CASE_STYLES.map((style) => (
                <div className="case-item" key={style}>
                  <div className="case-item-head">
                    <span>{CASE_STYLE_LABELS[style]}</span>
                    <CopyButton text={results[style]} label="Copy" />
                  </div>
                  <output className="case-value" aria-label={CASE_STYLE_LABELS[style]}>
                    {results[style]}
                  </output>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </ToolLayout>
  );
}

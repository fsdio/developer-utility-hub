import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/StatusMessage";
import { FieldLabel } from "@/components/common/Field";
import { convertColor } from "@/lib/dev/color";
import { getTool } from "@/registry/tools";

const TOOL = getTool("color")!;

const PRESETS = ["#2563eb", "#ffffff", "#0f1115", "#7f8c8d", "#e11d48", "#facc15", "#10b981"];

export default function ColorPage() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (input.trim() === "") return null;
    return convertColor(input);
  }, [input]);

  const rows =
    result?.ok
      ? [
          { label: "HEX", value: result.value.hex },
          { label: "RGB", value: result.value.rgb },
          { label: "HSL", value: result.value.hsl },
          { label: "Hue", value: `${result.value.hslValue.h}°` },
          { label: "Saturasi", value: `${result.value.hslValue.s}%` },
          { label: "Lightness", value: `${result.value.hslValue.l}%` },
          { label: "Alpha", value: String(result.value.rgbValue.a) },
        ]
      : [];

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="button button--ghost"
              onClick={() => setInput(preset)}
              aria-label={`Pakai warna ${preset}`}
              title={preset}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: preset,
                  border: "1px solid var(--border-strong)",
                }}
              />
              {preset}
            </button>
          ))}
          <span className="toolbar-spacer" />
          <CopyButton text={rows.map((row) => `${row.label}: ${row.value}`).join("\n")} label="Copy semua" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <div className="tool-grid tool-grid--single">
        <Panel label="Input warna" tone={result && !result.ok ? "error" : "default"}>
          <div style={{ padding: "var(--space-3)", width: "100%" }}>
            <FieldLabel htmlFor="color-input">HEX, rgb(), rgba(), hsl(), atau hsla()</FieldLabel>
            <div className="inline-input-row">
              <input
                id="color-input"
                type="text"
                value={input}
                spellCheck={false}
                placeholder="#2563eb"
                aria-invalid={result ? !result.ok : undefined}
                onChange={(event) => setInput(event.target.value)}
              />
            </div>
            <p className="hint-text" style={{ marginTop: "var(--space-2)" }}>
              Mendukung HEX 3/4/6/8 digit, rgb()/rgba(), hsl()/hsla(), nilai persen, dan hue
              di luar 0–360.
            </p>
          </div>
        </Panel>
      </div>

      <section className="result-block" aria-labelledby="color-result-heading">
        <h2 id="color-result-heading" className="category-title">
          Hasil
        </h2>
        {result === null ? (
          <EmptyState example={{ label: "Coba #2563eb", onUse: () => setInput("#2563eb") }}>
            Masukkan warna untuk melihat representasi HEX, RGB, dan HSL.
          </EmptyState>
        ) : !result.ok ? (
          <ErrorMessage error={result.error} />
        ) : (
          <>
            <div
              className="swatch"
              style={{
                background: result.value.hex,
                color: result.value.readableText === "dark" ? "#000000" : "#ffffff",
              }}
              aria-label={`Pratinjau warna ${result.value.hex}`}
            >
              {result.value.hex.toUpperCase()}
            </div>
            <dl className="stat-grid" style={{ marginTop: "var(--space-3)", padding: 0 }}>
              {rows.map((row) => (
                <div className="stat-card" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </section>
    </ToolLayout>
  );
}

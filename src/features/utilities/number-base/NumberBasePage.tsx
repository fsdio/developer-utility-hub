import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/common/Button";
import { FieldLabel, SelectField } from "@/components/common/Field";
import { groupBinary, NUMBER_BASES, parseNumber, type NumberBase } from "@/lib/dev/number-base";
import { getTool } from "@/registry/tools";

const TOOL = getTool("number-base")!;

const BASE_OPTIONS = NUMBER_BASES.map((base) => ({
  value: String(base) as `${NumberBase}`,
  label:
    base === 2 ? "Biner (2)" : base === 8 ? "Oktal (8)" : base === 10 ? "Desimal (10)" : "Heksadesimal (16)",
}));

export default function NumberBasePage() {
  const [input, setInput] = useState("");
  const [base, setBase] = useState<`${NumberBase}`>("10");

  const result = useMemo(() => {
    if (input.trim() === "") return null;
    return parseNumber(input, Number(base) as NumberBase);
  }, [input, base]);

  const rows =
    result?.ok
      ? [
          { label: "Desimal", value: result.value.decimal },
          { label: "Biner", value: result.value.binary },
          { label: "Biner (grup 4 bit)", value: groupBinary(result.value.binary) },
          { label: "Oktal", value: result.value.octal },
          { label: "Heksadesimal", value: result.value.hex },
          { label: "Jumlah bit", value: `${result.value.bits} bit` },
        ]
      : [];

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <SelectField id="number-base" label="Basis input" value={base} options={BASE_OPTIONS} onChange={setBase} />
          <Button onClick={() => setInput("255")}>Contoh: 255</Button>
          <span className="toolbar-spacer" />
          <CopyButton text={rows.map((row) => `${row.label}: ${row.value}`).join("\n")} label="Copy semua" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <div className="tool-grid tool-grid--single">
        <Panel label="Input angka" tone={result && !result.ok ? "error" : "default"}>
          <div style={{ padding: "var(--space-3)", width: "100%" }}>
            <FieldLabel htmlFor="number-input">Angka dalam basis {base}</FieldLabel>
            <div className="inline-input-row">
              <input
                id="number-input"
                type="text"
                value={input}
                spellCheck={false}
                inputMode={base === "10" ? "numeric" : "text"}
                placeholder={base === "16" ? "0xFF" : base === "2" ? "1010" : "255"}
                aria-invalid={result ? !result.ok : undefined}
                onChange={(event) => setInput(event.target.value)}
              />
            </div>
            <p className="hint-text" style={{ marginTop: "var(--space-2)" }}>
              Prefix (0b, 0o, 0x) dan pemisah underscore diizinkan. Perhitungan memakai BigInt,
              jadi angka besar tidak kehilangan presisi.
            </p>
          </div>
        </Panel>
      </div>

      <section className="result-block" aria-labelledby="number-result-heading">
        <h2 id="number-result-heading" className="category-title">
          Hasil
        </h2>
        {result === null ? (
          <EmptyState example={{ label: "Coba 255 dalam desimal", onUse: () => setInput("255") }}>
            Masukkan angka untuk melihat representasinya di basis lain.
          </EmptyState>
        ) : !result.ok ? (
          <ErrorMessage error={result.error} />
        ) : (
          <dl className="stat-grid">
            {rows.map((row) => (
              <div className="stat-card" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </ToolLayout>
  );
}

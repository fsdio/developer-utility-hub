import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CopyButton } from "@/components/common/CopyButton";
import { InlineResult } from "@/components/editor/InlineResult";
import { ResetButton } from "@/components/common/ResetButton";
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
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <Panel label="Angka" stacked tone={result && !result.ok ? "error" : "default"}>
        <div className="field-body field-body--inline">
          <FieldLabel htmlFor="number-input">Angka dalam basis {base}</FieldLabel>
          <input
            id="number-input"
            type="text"
            value={input}
            spellCheck={false}
            inputMode={base === "10" ? "numeric" : "text"}
            placeholder={base === "16" ? "0xFF" : base === "2" ? "1010" : "255"}
            aria-invalid={result ? !result.ok : undefined}
            aria-describedby="number-input-hint"
            onChange={(event) => setInput(event.target.value)}
          />
          <span id="number-input-hint" className="sr-only">
            Prefix 0b, 0o, 0x dan pemisah underscore diizinkan. Perhitungan memakai BigInt,
            sehingga angka besar tidak kehilangan presisi.
          </span>
        </div>
        <InlineResult
          label="Semua basis"
          tone={result && !result.ok ? "error" : "default"}
          actions={
            <CopyButton
              text={rows.map((row) => `${row.label}: ${row.value}`).join("\n")}
              label="Copy"
              compact
              context="semua basis"
            />
          }
        >
          {result === null ? (
            <div className="inline-result-pad">
              <p className="hint-text hint-text--tight">Masukkan angka untuk melihat representasinya di basis lain.</p>
            </div>
          ) : !result.ok ? (
            <div className="inline-result-pad">
              <ErrorMessage error={result.error} />
            </div>
          ) : (
            <dl className="stat-grid stat-grid--inline">
              {rows.map((row) => (
                <div className="stat-card" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </InlineResult>
      </Panel>
    </ToolLayout>
  );
}

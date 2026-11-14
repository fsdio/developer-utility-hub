import { useEffect, useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CopyButton } from "@/components/common/CopyButton";
import { InlineResult } from "@/components/editor/InlineResult";
import { ResetButton } from "@/components/common/ResetButton";
import { ErrorMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/common/Button";
import { FieldLabel } from "@/components/common/Field";
import { parseTimestamp } from "@/lib/dev/timestamp";
import { getTool } from "@/registry/tools";

const TOOL = getTool("timestamp")!;

const localOffset = (): number => -new Date().getTimezoneOffset();

export default function TimestampPage() {
  const [input, setInput] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [tick, setTick] = useState(0);

  const offsetMinutes = useMemo(localOffset, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
      setTick((value) => value + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const result = useMemo(() => {
    if (input.trim() === "") return null;
    return parseTimestamp(input, offsetMinutes, nowMs);
  }, [input, offsetMinutes, nowMs]);

  const setToNow = (): void => setInput(String(Math.floor(Date.now() / 1000)));

  const rows: Array<{ label: string; value: string }> =
    result?.ok
      ? [
          { label: "Epoch (detik)", value: String(result.value.seconds) },
          { label: "Epoch (milidetik)", value: String(result.value.milliseconds) },
          { label: "ISO 8601", value: result.value.iso },
          { label: "UTC", value: result.value.utc },
          { label: "Lokal", value: result.value.local },
          { label: "Relatif", value: result.value.relative },
        ]
      : [];

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <Button variant="primary" onClick={setToNow}>
            Isi dengan sekarang
          </Button>
          <span className="field">Zona waktu lokal terdeteksi: UTC{offsetMinutes >= 0 ? "+" : "-"}
            {String(Math.trunc(Math.abs(offsetMinutes) / 60)).padStart(2, "0")}:
            {String(Math.abs(offsetMinutes) % 60).padStart(2, "0")}
          </span>
          <span className="toolbar-spacer" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label="Timestamp / tanggal"
        stacked
        footer={`Jam berjalan setiap detik · ${tick} pembaruan`}
        tone={result && !result.ok ? "error" : "default"}
      >
        <div className="field-body field-body--inline">
          <FieldLabel htmlFor="timestamp-input">Angka epoch atau tanggal ISO 8601</FieldLabel>
          <input
            id="timestamp-input"
            type="text"
            value={input}
            spellCheck={false}
            placeholder="1700000000 atau 2026-11-12T08:30:00Z"
            aria-invalid={result ? !result.ok : undefined}
            aria-describedby="timestamp-input-hint"
            onChange={(event) => setInput(event.target.value)}
          />
          <span id="timestamp-input-hint" className="sr-only">
            Angka ≥ 1e12 dibaca sebagai milidetik. Tanpa offset, tanggal dibaca sebagai waktu lokal.
          </span>
        </div>
        <InlineResult
          label="Semua format"
          tone={result && !result.ok ? "error" : "default"}
          actions={
            <CopyButton
              text={rows.map((row) => `${row.label}: ${row.value}`).join("\n")}
              label="Copy"
              compact
              context="semua format"
            />
          }
        >
          {result === null ? (
            <div className="inline-result-pad">
              <p className="hint-text hint-text--tight">
                Masukkan epoch atau tanggal ISO untuk melihat semua representasinya.
              </p>
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

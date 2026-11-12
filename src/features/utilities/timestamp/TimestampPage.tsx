import { useEffect, useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
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
          <CopyButton text={rows.map((row) => `${row.label}: ${row.value}`).join("\n")} label="Copy semua" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <div className="tool-grid tool-grid--single">
        <Panel label="Input timestamp atau tanggal" footer={`Jam berjalan setiap detik · ${tick} pembaruan`}>
          <div style={{ padding: "var(--space-3)", width: "100%" }}>
            <FieldLabel htmlFor="timestamp-input">
              Angka epoch (detik/milidetik) atau ISO 8601
            </FieldLabel>
            <div className="inline-input-row">
              <input
                id="timestamp-input"
                type="text"
                value={input}
                spellCheck={false}
                placeholder="1700000000 atau 2026-11-12T08:30:00Z"
                onChange={(event) => setInput(event.target.value)}
              />
            </div>
            <p className="hint-text" style={{ marginTop: "var(--space-2)" }}>
              Angka ≥ 1e12 dibaca sebagai milidetik. Tanpa offset, tanggal dibaca sebagai waktu lokal.
            </p>
          </div>
        </Panel>
      </div>

      <section className="result-block" aria-labelledby="timestamp-result-heading">
        <h2 id="timestamp-result-heading" className="category-title">
          Hasil
        </h2>
        {result === null ? (
          <EmptyState example={{ label: "Isi dengan waktu sekarang", onUse: setToNow }}>
            Masukkan epoch atau tanggal ISO untuk melihat semua representasinya.
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

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { ErrorMessage } from "@/components/common/StatusMessage";
import { FieldLabel } from "@/components/common/Field";
import { convertColor, hexForColorInput, type ColorConversion } from "@/lib/dev/color";
import { getTool } from "@/registry/tools";

const TOOL = getTool("color")!;

const PRESETS = ["#2563eb", "#0ea5e9", "#10b981", "#facc15", "#f97316", "#e11d48", "#a855f7", "#64748b"];

/** Baris hasil: label, nilai teks, dan pemilih warna bila nilainya bisa dibalik. */
interface ColorRow {
  label: string;
  value: string;
  /** HEX kanonik untuk kontrol pemilih warna pada baris ini. */
  picker?: string;
}

export default function ColorPage() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (input.trim() === "") return null;
    return convertColor(input);
  }, [input]);

  const value: ColorConversion | null = result?.ok ? result.value : null;

  const rows: ColorRow[] = value
    ? [
        { label: "HEX", value: value.hex, picker: value.hex },
        { label: "RGB", value: value.rgb, picker: value.hex },
        { label: "HSL", value: value.hsl, picker: value.hex },
        { label: "Alpha", value: String(value.rgbValue.a) },
      ]
    : [];

  const pickColor = (hex: string): void => setInput(hex);

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <span className="toolbar-label">Cepat:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="swatch-button"
              onClick={() => pickColor(preset)}
              aria-label={`Pakai warna ${preset}`}
              aria-pressed={input.toLocaleLowerCase() === preset}
              title={preset}
              style={{ background: preset }}
            />
          ))}
          <span className="toolbar-spacer" />
          <CopyButton
            text={rows.map((row) => `${row.label}: ${row.value}`).join("\n")}
            label="Copy semua"
            context="semua nilai warna"
          />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <div className="tool-grid tool-grid--color">
        <Panel label="Input warna" tone={result && !result.ok ? "error" : "default"}>
          <div className="color-input-body">
            {/* Kontrol utama: warna dipilih langsung, bukan diketik. */}
            <div className="color-picker-row">
              <label className="color-picker-large">
                <span className="sr-only">Pilih warna</span>
                <input
                  type="color"
                  value={value ? hexForColorInput(value.rgbValue) : "#2563eb"}
                  onChange={(event) => setInput(event.target.value)}
                  data-testid="color-input-native"
                />
              </label>
              <div className="color-picker-meta">
                <FieldLabel htmlFor="color-input">ATAU TULIS KODE WARNA</FieldLabel>
                <input
                  id="color-input"
                  className="text-input mono-input"
                  type="text"
                  value={input}
                  spellCheck={false}
                  placeholder="#2563eb atau rgb(37, 99, 235)"
                  aria-invalid={result ? !result.ok : undefined}
                  onChange={(event) => setInput(event.target.value)}
                />
              </div>
            </div>
            <p className="hint-text">
              Mendukung HEX 3/4/6/8 digit, rgb()/rgba(), hsl()/hsla(), nilai persen, dan hue di luar
              0–360. Pemilih warna selalu memberi HEX tanpa alpha.
            </p>
          </div>
        </Panel>

        <Panel label="Pratinjau & hasil">
          {value === null ? (
            <div className="color-empty">
              <p className="hint-text">
                Pilih warna di samping, atau klik salah satu contoh cepat di atas toolbar.
              </p>
            </div>
          ) : (
            <div className="color-result">
              <div
                className="swatch swatch--hero"
                style={{
                  background: value.hex,
                  color: value.readableText === "dark" ? "#000000" : "#ffffff",
                }}
                aria-label={`Pratinjau warna ${value.hex}`}
              >
                <span className="swatch-value">{value.hex.toUpperCase()}</span>
                <span className="swatch-sub">
                  {value.readableText === "dark" ? "Teks gelap aman" : "Teks terang aman"}
                </span>
              </div>

              <ul className="color-rows">
                {rows.map((row) => (
                  <li className="color-row" key={row.label}>
                    <span className="color-row-label">{row.label}</span>
                    <code className="color-row-value">{row.value}</code>
                    <span className="color-row-actions">
                      <CopyButton text={row.value} label="Copy" compact context={`nilai ${row.label}`} />
                      {row.picker ? (
                        <label
                          className="mini-picker"
                          title={`Ubah warna dari ${row.label}`}
                          style={{ background: row.picker }}
                        >
                          <span className="sr-only">Ubah warna dari nilai {row.label}</span>
                          <input
                            type="color"
                            value={hexForColorInput(value.rgbValue)}
                            onChange={(event) => pickColor(event.target.value)}
                          />
                        </label>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      {result && !result.ok ? <ErrorMessage error={result.error} /> : null}
    </ToolLayout>
  );
}

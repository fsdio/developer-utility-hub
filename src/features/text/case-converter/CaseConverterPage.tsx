import { useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { CASE_STYLES, CASE_STYLE_LABELS, convert, type CaseStyle } from "@/lib/text/case";
import { getTool } from "@/registry/tools";

const TOOL = getTool("case-converter")!;

const EXAMPLE = "Hello, World! userID from HTTPResponse";

/**
 * Satu form, satu aksi (ADR-0014).
 *
 * Tombol gaya di atas form menentukan bentuk teks; hasilnya menggantikan isi
 * form, jadi pengguna bisa merangkai gaya (mis. camelCase → CONSTANT_CASE)
 * tanpa memilih baris hasil. Hanya ada SATU tombol salin untuk seluruh halaman.
 */
export default function CaseConverterPage() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState<CaseStyle>("camel");

  const overLimit = input.length > MAX_INPUT_LENGTH;

  const applyStyle = (next: CaseStyle): void => {
    setStyle(next);
    if (input.trim() === "") return;
    // Hasil langsung masuk ke form: satu tempat untuk input dan output.
    setInput(convert(input, next));
  };

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <div className="action-group" role="group" aria-label="Gaya penulisan">
            {CASE_STYLES.map((item) => (
              <Button
                key={item}
                variant={item === style ? "primary" : "default"}
                aria-pressed={item === style}
                onClick={() => applyStyle(item)}
              >
                {CASE_STYLE_LABELS[item]}
              </Button>
            ))}
          </div>
          <span className="toolbar-spacer" />
          <CopyButton text={input} context="teks" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label={`Teks · ${CASE_STYLE_LABELS[style]}`}
        tone={overLimit ? "error" : "default"}
        footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
      >
        {overLimit ? (
          <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
        ) : (
          <CodeArea
            label={`Teks dalam ${CASE_STYLE_LABELS[style]}`}
            value={input}
            onChange={setInput}
            placeholder="Tempel teks di sini, mis. hello world"
            hint={`Tekan tombol gaya di toolbar untuk mengubah seluruh teks ke ${CASE_STYLE_LABELS[style]}. Hasilnya menggantikan isi form.`}
            rows={14}
          />
        )}
      </Panel>

      {input.trim() === "" && !overLimit ? (
        <p className="hint-text hint-text--tight">
          Mulai dengan menempel teks, atau{" "}
          <button type="button" className="link-button" onClick={() => setInput(EXAMPLE)}>
            coba contoh
          </button>
          .
        </p>
      ) : null}
    </ToolLayout>
  );
}

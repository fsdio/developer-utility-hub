import { useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { DownloadButton } from "@/components/common/DownloadButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { decodeHtmlEntities, encodeHtmlEntities } from "@/lib/encoding/html-entity";
import { getTool } from "@/registry/tools";

const TOOL = getTool("html-entity")!;

/** Satu form, satu aksi (ADR-0014). */
export default function HtmlEntityPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const overLimit = input.length > MAX_INPUT_LENGTH;


  const run = (next: "encode" | "decode"): void => {
    setMode(next);
    if (input === "") return;
    setInput(next === "encode" ? encodeHtmlEntities(input) : decodeHtmlEntities(input));
  };

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <div className="action-group" role="group" aria-label="Arah konversi">
            <Button
              variant={mode === "encode" ? "primary" : "default"}
              onClick={() => run("encode")}
              aria-pressed={mode === "encode"}
            >
              Encode
            </Button>
            <Button
              variant={mode === "decode" ? "primary" : "default"}
              onClick={() => run("decode")}
              aria-pressed={mode === "decode"}
            >
              Decode
            </Button>
          </div>
          <span className="toolbar-spacer" />
          <CopyButton text={input} context="teks" />
          <DownloadButton text={input} baseName="html-entity" extension="html" mime="text/html" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label={mode === "encode" ? "HTML mentah" : "HTML dengan entity"}
        footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
      >
        {overLimit ? (
          <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
        ) : (
          <CodeArea
            label={mode === "encode" ? "HTML mentah" : "HTML dengan entity"}
            value={input}
            onChange={setInput}
            placeholder={mode === "encode" ? `<a href="x">Tom & Jerry's</a>` : "&lt;a href=&quot;x&quot;&gt;"}
            hint="Tekan Encode atau Decode; hasilnya menggantikan isi form. Encode mengubah & < > &quot; dan ' menjadi entity; decode menangani entity bernama umum serta numerik."
            rows={14}
          />
        )}
      </Panel>
    </ToolLayout>
  );
}

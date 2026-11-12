import { useMemo, useState } from "react";
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

export default function HtmlEntityPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const overLimit = input.length > MAX_INPUT_LENGTH;

  const output = useMemo(() => {
    if (input === "" || overLimit) return null;
    return mode === "encode" ? encodeHtmlEntities(input) : decodeHtmlEntities(input);
  }, [input, mode, overLimit]);

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <Button variant={mode === "encode" ? "primary" : "default"} onClick={() => setMode("encode")} aria-pressed={mode === "encode"}>
            Encode
          </Button>
          <Button variant={mode === "decode" ? "primary" : "default"} onClick={() => setMode("decode")} aria-pressed={mode === "decode"}>
            Decode
          </Button>
          <span className="toolbar-spacer" />
          <CopyButton text={output ?? ""} />
          <DownloadButton text={output ?? ""} baseName="html-entity" extension="html" mime="text/html" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <div className="tool-grid">
        <Panel
          label="Input"
          footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter`}
        >
          <CodeArea
            label={mode === "encode" ? "HTML mentah" : "HTML dengan entity"}
            value={input}
            onChange={setInput}
            placeholder={mode === "encode" ? `<a href="x">Tom & Jerry's</a>` : "&lt;a href=&quot;x&quot;&gt;"}
            hint="Encode mengubah & < > &quot; dan ' menjadi entity. Decode menangani entity bernama umum serta numerik."
          />
        </Panel>

        <Panel label="Hasil">
          {overLimit ? (
            <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
          ) : output === null ? (
            <EmptyState example={{ label: "Coba contoh", onUse: () => setInput("<p>Tom & Jerry's</p>") }}>
              Encode teks agar aman ditampilkan sebagai teks, bukan HTML.
            </EmptyState>
          ) : (
            <pre className="output-area output-area--wrap">{output}</pre>
          )}
        </Panel>
      </div>
    </ToolLayout>
  );
}

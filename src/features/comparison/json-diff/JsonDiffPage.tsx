import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { InlineResult } from "@/components/editor/InlineResult";
import { CopyButton } from "@/components/common/CopyButton";
import { DownloadButton } from "@/components/common/DownloadButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage, StatusMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/common/Button";
import { MAX_COMBINED_LENGTH } from "@/lib/limits";
import { diffJson } from "@/lib/diff/json";
import { patchToText } from "@/lib/diff/json-patch";
import { getTool } from "@/registry/tools";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const TOOL = getTool("json-diff")!;

const EXAMPLE_LEFT = `{"id": 7, "name": "devkit", "tags": ["json", "xml"], "meta": {"version": 1}}`;
const EXAMPLE_RIGHT = `{"id": 7, "name": "developer-utility-hub", "tags": ["json", "xml", "diff"], "meta": {"version": 2, "stable": true}}`;

type View = "path" | "patch";

const formatValue = (value: unknown): string =>
  value === undefined ? "—" : JSON.stringify(value);

export default function JsonDiffPage() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [view, setView] = useState<View>("path");

  const debouncedLeft = useDebouncedValue(left);
  const debouncedRight = useDebouncedValue(right);
  const overLimit = left.length + right.length > MAX_COMBINED_LENGTH;
  const empty = left.trim() === "" || right.trim() === "";

  const result = useMemo(() => {
    if (overLimit || empty) return null;
    return diffJson(debouncedLeft, debouncedRight);
  }, [debouncedLeft, debouncedRight, overLimit, empty]);

  const patch = result?.ok ? patchToText(result.value.changes) : "";
  const exportText = result?.ok
    ? view === "patch"
      ? patch
      : JSON.stringify(result.value.changes, null, 2)
    : "";

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <Button variant="primary" onClick={() => setView("path")} aria-pressed={view === "path"}>
            Tampilan path
          </Button>
          <Button onClick={() => setView("patch")} aria-pressed={view === "patch"}>
            Tampilan patch
          </Button>
          <span className="toolbar-spacer" />
          <DownloadButton
            text={exportText}
            baseName="json-diff"
            extension={view === "patch" ? "patch.json" : "json"}
            mime="application/json"
          />
          <ResetButton
            onReset={() => {
              setLeft("");
              setRight("");
            }}
            disabled={left === "" && right === ""}
          />
        </>
      }
    >
      <div className="tool-grid">
        <Panel label="JSON kiri" footer={`${left.length.toLocaleString("id-ID")} karakter`}>
          <CodeArea
            label="JSON original"
            value={left}
            onChange={setLeft}
            placeholder='{"version": 1}'
            rows={10}
          />
        </Panel>

        {/* Hasil perbedaan menempel di panel kanan, bukan section terpisah di
            bawah form, agar perbandingan terlihat tanpa menggulir. */}
        <Panel
          label="JSON kanan"
          stacked
          footer={`${right.length.toLocaleString("id-ID")} karakter`}
        >
          <CodeArea
            label="JSON modified"
            value={right}
            onChange={setRight}
            placeholder='{"version": 2}'
            rows={10}
          />
          <InlineResult
            label={
              overLimit ? "Batas input" : empty ? "Menunggu input" : view === "patch" ? "Patch" : "Perubahan"
            }
            tone={overLimit || (result && !result.ok) ? "error" : "default"}
            meta={
              result?.ok
                ? `+${result.value.added} −${result.value.removed} ~${result.value.changed}${
                    result.value.identical ? " · identik" : ""
                  }`
                : undefined
            }
            actions={
              result?.ok ? (
                <CopyButton text={exportText} label="Copy" compact context="hasil diff" />
              ) : undefined
            }
          >
            {overLimit ? (
              <StatusMessage tone="error">
                Total input melebihi 1.000.000 karakter. Perkecil input untuk membandingkan.
              </StatusMessage>
            ) : empty ? (
              <EmptyState
                example={{
                  label: "Isi kedua panel dengan contoh",
                  onUse: () => {
                    setLeft(EXAMPLE_LEFT);
                    setRight(EXAMPLE_RIGHT);
                  },
                }}
              >
                Tempel dua JSON yang valid. Perbandingan dilakukan per struktur, bukan per baris.
              </EmptyState>
            ) : result && !result.ok ? (
              <ErrorMessage error={result.error} />
            ) : result?.ok ? (
              result.value.identical ? (
                <p className="hint-text hint-text--tight">Kedua dokumen identik secara struktur.</p>
              ) : view === "patch" ? (
                <pre className="output-area">{patch}</pre>
              ) : (
                <table className="change-table">
                  <caption className="sr-only">Daftar perubahan per JSON Pointer</caption>
                  <thead>
                    <tr>
                      <th scope="col">Path</th>
                      <th scope="col">Jenis</th>
                      <th scope="col">Sebelum</th>
                      <th scope="col">Sesudah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.value.changes.map((change, index) => (
                      <tr key={`${change.path}-${change.kind}-${index}`}>
                        <td>
                          <code>{change.path === "" ? "(root)" : change.path}</code>
                        </td>
                        <td>
                          <span className={`kind kind--${change.kind}`}>{change.kind}</span>
                          {change.typeChange ? (
                            <span className="keyword" style={{ marginLeft: 6 }}>
                              {change.typeChange.from} → {change.typeChange.to}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <code>{formatValue(change.before)}</code>
                        </td>
                        <td>
                          <code>{formatValue(change.after)}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : null}
          </InlineResult>
        </Panel>
      </div>
    </ToolLayout>
  );
}

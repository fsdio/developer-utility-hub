import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { DiffView } from "@/components/editor/DiffView";
import { DiffLegend } from "@/components/editor/DiffSummary";
import { InlineResult } from "@/components/editor/InlineResult";
import { CopyButton } from "@/components/common/CopyButton";
import { DownloadButton } from "@/components/common/DownloadButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/common/Button";
import { CheckboxField } from "@/components/common/Field";
import { MAX_COMBINED_LENGTH } from "@/lib/limits";
import { diffText } from "@/lib/diff/text";
import { getTool } from "@/registry/tools";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLocalStoragePreference } from "@/hooks/useLocalStoragePreference";
import { PREFERENCE_KEYS } from "@/lib/browser/storage";

const TOOL = getTool("text-diff")!;

const EXAMPLE_LEFT = `nama: Rani
peran: developer
kota: Bandung`;

const EXAMPLE_RIGHT = `nama: Rani
peran: senior developer
kota: Jakarta
status: aktif`;

interface DiffPrefs {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
}

const DEFAULT_PREFS: DiffPrefs = { ignoreCase: false, ignoreWhitespace: false };

const parsePrefs = (raw: string | null): DiffPrefs => {
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      return {
        ignoreCase: record.ignoreCase === true,
        ignoreWhitespace: record.ignoreWhitespace === true,
      };
    }
  } catch {
    // pakai default
  }
  return DEFAULT_PREFS;
};

export default function TextDiffPage() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [prefsRaw, setPrefsRaw] = useLocalStoragePreference<string>(
    PREFERENCE_KEYS.textDiffOptions,
    JSON.stringify(DEFAULT_PREFS),
    (value): value is string => typeof value === "string",
  );

  const prefs = parsePrefs(prefsRaw);
  const updatePrefs = (next: Partial<DiffPrefs>): void =>
    setPrefsRaw(JSON.stringify({ ...prefs, ...next }));

  const debouncedLeft = useDebouncedValue(left);
  const debouncedRight = useDebouncedValue(right);
  const overLimit = left.length + right.length > MAX_COMBINED_LENGTH;
  const empty = left.trim() === "" || right.trim() === "";

  const result = useMemo(() => {
    if (overLimit || empty) return null;
    return diffText(debouncedLeft, debouncedRight, prefs);
  }, [debouncedLeft, debouncedRight, prefs, overLimit, empty]);

  const swap = (): void => {
    setLeft(right);
    setRight(left);
  };

  const reset = (): void => {
    setLeft("");
    setRight("");
  };

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <Button onClick={swap} disabled={left === "" && right === ""}>
            Tukar panel
          </Button>
          <CheckboxField
            id="diff-ignore-case"
            label="Ignore case"
            checked={prefs.ignoreCase}
            onChange={(checked) => updatePrefs({ ignoreCase: checked })}
          />
          <CheckboxField
            id="diff-ignore-ws"
            label="Ignore whitespace"
            checked={prefs.ignoreWhitespace}
            onChange={(checked) => updatePrefs({ ignoreWhitespace: checked })}
          />
          <span className="toolbar-spacer" />
          <DownloadButton
            text={result?.unified ?? ""}
            baseName="text-diff"
            extension="diff"
            mime="text/plain"
          />
          <ResetButton onReset={reset} disabled={left === "" && right === ""} />
        </>
      }
    >
      <div className="tool-grid">
        <Panel label="Original" footer={`${left.length.toLocaleString("id-ID")} karakter`}>
          <CodeArea
            label="Teks original"
            value={left}
            onChange={setLeft}
            placeholder="Teks sebelum perubahan"
            rows={10}
          />
        </Panel>

        {/* Panel kanan memuat input dan hasilnya sekaligus: pengguna melihat
            perbedaan tanpa menggulir ke bagian bawah halaman. */}
        <Panel
          label="Modified"
          stacked
          footer={`${right.length.toLocaleString("id-ID")} karakter`}
        >
          <CodeArea
            label="Teks modified"
            value={right}
            onChange={setRight}
            placeholder="Teks sesudah perubahan"
            rows={10}
          />
          <InlineResult
            label={overLimit ? "Batas input" : empty ? "Menunggu input" : "Perbedaan"}
            tone={overLimit ? "error" : "default"}
            meta={
              result
                ? `+${result.added} −${result.removed} ~${result.modified}${
                    result.identical ? " · identik" : ""
                  }`
                : undefined
            }
            actions={
              result ? (
                <CopyButton text={result.unified} label="Copy" compact context="diff" />
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
                Isi kedua panel untuk melihat perbedaan baris dan karakter.
              </EmptyState>
            ) : result ? (
              <>
                <DiffLegend />
                <DiffView lines={result.lines} />
              </>
            ) : null}
          </InlineResult>
        </Panel>
      </div>
    </ToolLayout>
  );
}

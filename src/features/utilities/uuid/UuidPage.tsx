import { useCallback, useEffect, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/common/Button";
import { CopyButton } from "@/components/common/CopyButton";
import { SelectField } from "@/components/common/Field";
import { generateUuids, randomSourceLabel, type UuidVersion } from "@/lib/dev/uuid";
import { getTool } from "@/registry/tools";

const TOOL = getTool("uuid")!;

const VERSION_OPTIONS = [
  { value: "4", label: "v4 (acak)" },
  { value: "7", label: "v7 (berurutan waktu)" },
] as const;

const COUNT_OPTIONS = [
  { value: "1", label: "1 UUID" },
  { value: "5", label: "5 UUID" },
  { value: "10", label: "10 UUID" },
  { value: "50", label: "50 UUID" },
] as const;

export default function UuidPage() {
  const [version, setVersion] = useState<"4" | "7">("4");
  const [count, setCount] = useState<"1" | "5" | "10" | "50">("5");
  const [uuids, setUuids] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(() => {
    try {
      setUuids(generateUuids(Number(count), Number(version) as UuidVersion));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [count, version]);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <SelectField id="uuid-version" label="Versi" value={version} options={VERSION_OPTIONS} onChange={setVersion} />
          <SelectField id="uuid-count" label="Jumlah" value={count} options={COUNT_OPTIONS} onChange={setCount} />
          <Button variant="primary" onClick={generate}>
            Buat ulang
          </Button>
          <span className="toolbar-spacer" />
          <CopyButton text={uuids.join("\n")} label="Copy semua" />
        </>
      }
    >
      <Panel
        label="UUID"
        footer={`Sumber acak: ${randomSourceLabel()} · tidak ada UUID yang disimpan atau dikirim`}
      >
        {error ? (
          <div style={{ padding: "var(--space-3)" }}>
            <StatusMessage tone="error">{error}</StatusMessage>
          </div>
        ) : uuids.length === 0 ? (
          <EmptyState>Tekan “Buat ulang” untuk menghasilkan UUID.</EmptyState>
        ) : (
          <ol className="uuid-list">
            {uuids.map((uuid, index) => (
              <li className="uuid-row" key={`${uuid}-${index}`}>
                <code>{uuid}</code>
                <CopyButton text={uuid} label="Copy" />
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <p className="hint-text" style={{ marginTop: "var(--space-3)" }}>
        UUID v4 sepenuhnya acak. UUID v7 memuat timestamp milidetik di 48 bit awal sehingga
        terurut secara waktu — berguna untuk primary key, tetapi <strong>tetap</strong> bukan
        pengganti ID yang tidak bisa ditebak untuk data rahasia.
      </p>
    </ToolLayout>
  );
}

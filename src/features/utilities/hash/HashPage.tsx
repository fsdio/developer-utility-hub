import { useEffect, useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { InlineResult } from "@/components/editor/InlineResult";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusMessage } from "@/components/common/StatusMessage";
import { SelectField } from "@/components/common/Field";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { HASH_ALGORITHMS, hashText, type HashAlgorithm, type HashResult } from "@/lib/dev/hash";
import { getTool } from "@/registry/tools";

const TOOL = getTool("hash")!;

const ALGORITHM_OPTIONS = HASH_ALGORITHMS.map((algorithm) => ({
  value: algorithm,
  label: algorithm,
}));

const getSubtle = (): SubtleCrypto | undefined =>
  typeof crypto !== "undefined" && crypto.subtle ? crypto.subtle : undefined;

export default function HashPage() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [result, setResult] = useState<HashResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const overLimit = input.length > MAX_INPUT_LENGTH;
  const subtle = useMemo(getSubtle, []);

  useEffect(() => {
    if (input === "" || overLimit) {
      setResult(null);
      setError(null);
      setPending(false);
      return;
    }

    let active = true;
    setPending(true);
    const timer = setTimeout(() => {
      void hashText(input, algorithm, subtle).then((outcome) => {
        if (!active) return;
        setPending(false);
        if (outcome.ok) {
          setResult(outcome.value);
          setError(null);
        } else {
          setResult(null);
          setError(outcome.error.message);
        }
      });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [input, algorithm, subtle, overLimit]);

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <SelectField
            id="hash-algorithm"
            label="Algoritma"
            value={algorithm}
            options={ALGORITHM_OPTIONS}
            onChange={setAlgorithm}
          />
          <span className="toolbar-spacer" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label={pending ? "Teks · menghitung…" : "Teks"}
        footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter · UTF-8`}
      >
        <CodeArea
          label="Teks yang akan di-hash"
          value={input}
          onChange={setInput}
          placeholder="hello world"
          hint="Hash dihitung dengan Web Crypto di perangkat Anda; input tidak dikirim ke mana pun."
          rows={8}
        />
        <InlineResult
          label={pending ? "Digest · menghitung…" : "Digest"}
          tone={error ? "error" : "default"}
          actions={<CopyButton text={result?.hex ?? ""} label="Copy" compact context="hash hex" />}
        >
          {error ? (
            <div className="inline-result-pad">
              <StatusMessage tone="error">{error}</StatusMessage>
            </div>
          ) : overLimit ? (
            <EmptyState>Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.</EmptyState>
          ) : result ? (
            <dl className="stat-grid stat-grid--inline">
              <div className="stat-card">
                <dt>Algoritma</dt>
                <dd>
                  {result.algorithm} · {result.bits} bit
                </dd>
              </div>
              <div className="stat-card">
                <dt>Hex</dt>
                <dd>{result.hex}</dd>
              </div>
              <div className="stat-card">
                <dt>Base64</dt>
                <dd>{result.base64}</dd>
              </div>
            </dl>
          ) : (
            <EmptyState example={{ label: "Hash “hello world”", onUse: () => setInput("hello world") }}>
              Masukkan teks untuk melihat digest {algorithm}.
            </EmptyState>
          )}
        </InlineResult>
      </Panel>
    </ToolLayout>
  );
}

import { useCallback, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { Button } from "@/components/common/Button";
import { SelectField, TextField } from "@/components/common/Field";
import { ErrorMessage, StatusMessage } from "@/components/common/StatusMessage";
import {
  TOKEN_ALPHABETS,
  fingerprintToken,
  generateToken,
  tokenEntropyBits,
  type DigestAlgorithm,
  type TokenAlphabet,
} from "@/lib/dev/auth";
import { getTool } from "@/registry/tools";
import type { ToolError } from "@/types/result";

const TOOL = getTool("api-key")!;

const ALPHABET_OPTIONS = [
  { value: "base64url", label: "Base64URL (64 karakter)" },
  { value: "alnum", label: "Huruf + angka (62)" },
  { value: "hex", label: "Hex (16)" },
] as const;

const LENGTH_OPTIONS = [
  { value: "24", label: "24" },
  { value: "32", label: "32" },
  { value: "43", label: "43 (256 bit)" },
  { value: "48", label: "48" },
  { value: "64", label: "64" },
] as const;

const DIGEST_OPTIONS = [
  { value: "SHA-256", label: "SHA-256" },
  { value: "SHA-512", label: "SHA-512" },
  { value: "SHA-1", label: "SHA-1 (lama)" },
] as const;

/**
 * API key / token generator (ADR-0018).
 *
 * Satu form: Generate membuat token baru, Sidik jari menghitung hash token yang
 * sedang tampil (server hanya perlu menyimpan hash, bukan token aslinya). Token
 * hanya hidup di state React — menutup tab menghapusnya.
 */
export default function ApiKeyPage() {
  const [token, setToken] = useState("");
  const [length, setLength] = useState("43");
  const [alphabet, setAlphabet] = useState<TokenAlphabet>("base64url");
  const [prefix, setPrefix] = useState("");
  const [digestAlgorithm, setDigestAlgorithm] = useState<DigestAlgorithm>("SHA-256");
  const [digest, setDigest] = useState<{ hex: string; base64: string } | null>(null);
  const [error, setError] = useState<ToolError | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const generate = useCallback((): void => {
    setDigest(null);
    setError(null);
    const result = generateToken({ length: Number(length), alphabet, prefix: prefix.trim() });
    if (!result.ok) {
      setError(result.error);
      setStatus(null);
      return;
    }
    setToken(result.value);
    setStatus(
      `Token ${result.value.length} karakter · ${tokenEntropyBits(Number(length), alphabet)} bit entropi pada bagian acaknya.`,
    );
  }, [alphabet, length, prefix]);

  const fingerprint = useCallback(async (): Promise<void> => {
    setError(null);
    const result = await fingerprintToken(token, digestAlgorithm);
    if (!result.ok) {
      setError(result.error);
      setStatus(null);
      return;
    }
    setDigest(result.value);
    setStatus(`Sidik jari ${digestAlgorithm} dihitung di perangkat ini.`);
  }, [digestAlgorithm, token]);

  const reset = (): void => {
    setToken("");
    setDigest(null);
    setError(null);
    setStatus(null);
  };

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <div className="action-group" role="group" aria-label="Aksi token">
            <Button variant="primary" onClick={generate}>
              Generate
            </Button>
            <Button onClick={() => void fingerprint()} disabled={token === ""}>
              Sidik jari
            </Button>
          </div>
          <SelectField
            id="api-key-length"
            label="Panjang"
            value={length}
            options={LENGTH_OPTIONS}
            onChange={setLength}
          />
          <SelectField
            id="api-key-alphabet"
            label="Alfabet"
            value={alphabet}
            options={ALPHABET_OPTIONS}
            onChange={setAlphabet}
          />
          <span className="toolbar-spacer" />
          <CopyButton text={token} context="API key" disabled={token === ""} />
          <ResetButton onReset={reset} disabled={token === ""} />
        </>
      }
    >
      <Panel
        label="Token"
        tone={error ? "error" : "default"}
        footer={
          token === ""
            ? "belum ada token"
            : `${token.length} karakter · acak kriptografis · tidak disimpan`
        }
      >
        <CodeArea
          label="Token yang dihasilkan"
          value={token}
          onChange={(value) => {
            setToken(value);
            setDigest(null);
            setError(null);
          }}
          placeholder="Tekan Generate untuk membuat token baru"
          hint="Token dibuat dengan crypto.getRandomValues memakai rejection sampling, tanpa bias modulo."
          rows={4}
          readOnly
        />
        <div className="field-body field-body--inline">
          <TextField
            id="api-key-prefix"
            label="Awalan opsional"
            value={prefix}
            placeholder="sk_live_"
            onChange={setPrefix}
          />
          <SelectField
            id="api-key-digest-alg"
            label="Algoritma sidik jari"
            value={digestAlgorithm}
            options={DIGEST_OPTIONS}
            onChange={setDigestAlgorithm}
          />
        </div>
      </Panel>

      {digest ? (
        <Panel
          label={`Sidik jari ${digestAlgorithm}`}
          footer="Simpan hash-nya, bukan token aslinya, supaya kunci tetap bisa diperiksa."
        >
          <dl className="stat-grid stat-grid--inline">
            <div className="stat-card">
              <dt>Hex</dt>
              <dd>{digest.hex}</dd>
            </div>
            <div className="stat-card">
              <dt>Base64</dt>
              <dd>{digest.base64}</dd>
            </div>
          </dl>
        </Panel>
      ) : null}

      {error ? (
        <div className="result-block">
          <ErrorMessage error={error} />
        </div>
      ) : null}

      {status && !error ? (
        <div className="result-block">
          <StatusMessage tone="success">{status}</StatusMessage>
        </div>
      ) : null}

      <p className="hint-text hint-text--tight">
        {Object.keys(TOKEN_ALPHABETS).length} alfabet tersedia; token hanya hidup di tab ini dan
        hilang permanen saat tab ditutup.
      </p>
    </ToolLayout>
  );
}

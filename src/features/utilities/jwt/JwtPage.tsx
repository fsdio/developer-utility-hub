import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage, StatusMessage } from "@/components/common/StatusMessage";
import { CLAIM_STATE_LABELS, decodeJwt } from "@/lib/dev/jwt";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { getTool } from "@/registry/tools";

const TOOL = getTool("jwt")!;

const EXAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlJhbmkiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.c2lnbmF0dXJlLWNvbnRvaA";

/**
 * Peringatan signature: komponen terpisah, sengaja tidak bisa ditutup
 * dan selalu dirender di atas hasil (ADR-0009 §2).
 */
function SignatureDisclaimer() {
  return (
    <StatusMessage tone="error">
      <strong>Signature tidak diverifikasi.</strong> Token yang dipalsukan akan tetap
      tampil di sini. Tool ini tidak menerima secret atau public key, sehingga tidak
      mungkin memastikan token asli — gunakan library di sisi server Anda untuk itu.
    </StatusMessage>
  );
}

export default function JwtPage() {
  const [input, setInput] = useState("");

  const overLimit = input.length > MAX_INPUT_LENGTH;
  const result = useMemo(() => {
    if (input.trim() === "" || overLimit) return null;
    return decodeJwt(input);
  }, [input, overLimit]);

  const payloadJson = result?.ok ? JSON.stringify(result.value.payload, null, 2) : "";
  const headerJson = result?.ok ? JSON.stringify(result.value.header, null, 2) : "";

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <span className="field">
            Decode saja · tanpa input kunci · tidak ada permintaan jaringan
          </span>
          <span className="toolbar-spacer" />
          <CopyButton text={payloadJson} label="Copy payload" />
          <CopyButton text={headerJson} label="Copy header" />
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <div className="tool-grid tool-grid--single">
        <Panel
          label="Token JWT"
          tone={result && !result.ok ? "error" : "default"}
          footer={`${input.length.toLocaleString("id-ID")} / ${MAX_INPUT_LENGTH.toLocaleString("id-ID")} karakter · di-decode di browser Anda`}
        >
          <CodeArea
            label="Token yang akan di-decode"
            value={input}
            onChange={setInput}
            placeholder="header.payload.signature"
            hint="Tempel token JWS (3 bagian). Token JWE (5 bagian) ditolak karena tidak didekripsi."
            error={Boolean(result && !result.ok)}
            rows={6}
          />
        </Panel>
      </div>

      <section className="result-block" aria-labelledby="jwt-result-heading">
        <h2 id="jwt-result-heading" className="category-title">
          Hasil decode
        </h2>

        {overLimit ? (
          <StatusMessage tone="error">
            Input melebihi 1.000.000 karakter. Perkecil input untuk memproses.
          </StatusMessage>
        ) : result === null ? (
          <EmptyState example={{ label: "Coba contoh token", onUse: () => setInput(EXAMPLE) }}>
            Decoder ini tidak memverifikasi signature; token palsu pun akan tampil. Jangan
            menempelkan token produksi yang masih berlaku.
          </EmptyState>
        ) : !result.ok ? (
          <ErrorMessage error={result.error} />
        ) : (
          <>
            <SignatureDisclaimer />

            {result.value.unsigned ? (
              <StatusMessage tone="error">
                <strong>Header menetapkan alg “none”.</strong> Token ini tidak memiliki
                signature sama sekali — jangan pernah menerimanya di sistem yang membutuhkan
                autentikasi.
              </StatusMessage>
            ) : null}

            <p className="diff-summary" aria-live="polite">
              <span>alg {result.value.algorithm ?? "(tidak ada)"}</span>
              <span>3 bagian</span>
              <span>signature: {result.value.signature === "" ? "kosong" : "ada, tidak diperiksa"}</span>
            </p>

            {result.value.claims.length > 0 ? (
              <dl className="stat-grid" style={{ padding: 0, marginBottom: "var(--space-3)" }}>
                {result.value.claims.map((claim) => (
                  <div className="stat-card" key={claim.claim}>
                    <dt>
                      {claim.claim} · {CLAIM_STATE_LABELS[claim.state]}
                    </dt>
                    <dd>
                      {claim.iso}
                      {"\n"}
                      {claim.epoch}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="tool-grid">
              <Panel label="Header">
                <pre className="output-area output-area--wrap">{headerJson}</pre>
              </Panel>
              <Panel label="Payload">
                <pre className="output-area output-area--wrap">{payloadJson}</pre>
              </Panel>
            </div>

            <p className="hint-text" style={{ marginTop: "var(--space-3)" }}>
              Status <code>exp</code>/<code>nbf</code> di atas hanya perbandingan dengan jam
              perangkat Anda, bukan validasi token. Claim <code>iss</code>, <code>aud</code>,
              dan rantai sertifikat tidak diperiksa.
            </p>
          </>
        )}
      </section>
    </ToolLayout>
  );
}

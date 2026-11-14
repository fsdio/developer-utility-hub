import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { InlineResult } from "@/components/editor/InlineResult";
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
          <ResetButton onReset={() => setInput("")} disabled={input === ""} />
        </>
      }
    >
      <Panel
        label="Token JWT"
        stacked
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
          rows={5}
        />
        <InlineResult
          label="Hasil decode"
          tone={result && !result.ok ? "error" : "default"}
          meta={
            result?.ok
              ? `alg ${result.value.algorithm ?? "(tidak ada)"} · signature: ${
                  result.value.signature === "" ? "kosong" : "tidak diperiksa"
                }`
              : undefined
          }
          actions={<CopyButton text={payloadJson} label="Copy" compact context="payload" />}
        >
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
                <div className="inline-result-pad">
                  <StatusMessage tone="error">
                    <strong>Header menetapkan alg “none”.</strong> Token ini tidak memiliki
                    signature sama sekali — jangan pernah menerimanya di sistem yang membutuhkan
                    autentikasi.
                  </StatusMessage>
                </div>
              ) : null}

              {result.value.claims.length > 0 ? (
                <dl className="stat-grid stat-grid--inline">
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

              <div className="jwt-parts">
                <div className="jwt-part">
                  <span className="jwt-part-label">Header</span>
                  <pre className="output-area output-area--wrap">{headerJson}</pre>
                </div>
                <div className="jwt-part">
                  <span className="jwt-part-label">Payload</span>
                  <pre className="output-area output-area--wrap">{payloadJson}</pre>
                </div>
              </div>
            </>
          )}
        </InlineResult>
      </Panel>
    </ToolLayout>
  );
}

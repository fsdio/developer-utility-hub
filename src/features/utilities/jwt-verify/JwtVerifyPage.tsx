import { useCallback, useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { Button } from "@/components/common/Button";
import { FieldLabel, SelectField } from "@/components/common/Field";
import { StatusMessage } from "@/components/common/StatusMessage";
import {
  JWT_ALGORITHMS,
  auditClaims,
  isJwtAlgorithm,
  readJwt,
  verifyJwtSignature,
  type ClaimCheck,
  type JwtAlgorithm,
  type SignatureCheck,
} from "@/lib/dev/auth";
import { getTool } from "@/registry/tools";

const TOOL = getTool("jwt-verify")!;

const ALGORITHM_OPTIONS = (Object.keys(JWT_ALGORITHMS) as JwtAlgorithm[]).map((algorithm) => ({
  value: algorithm,
  label: `${algorithm} — ${JWT_ALGORITHMS[algorithm].label}`,
}));

const VERDICT_LABEL: Record<SignatureCheck["verdict"], string> = {
  valid: "Signature cocok",
  invalid: "Signature tidak cocok",
  unverified: "Tidak ada signature",
  "wrong-algorithm": "Algoritma tidak cocok",
  error: "Belum bisa diverifikasi",
};

/** Nada visual per status klaim; teksnya selalu menyebut alasannya. */
const CLAIM_TONE: Record<ClaimCheck["state"], string> = {
  ok: "claim-note claim-note--ok",
  warn: "claim-note claim-note--warn",
  fail: "claim-note claim-note--fail",
  gap: "claim-note claim-note--gap",
};

/**
 * JWT Verify (ADR-0018) — decode + verifikasi signature dengan kunci yang
 * ditempel pengguna, plus audit klaim.
 *
 * Berbeda dari JWT Decoder (ADR-0009) yang sengaja tidak menerima kunci: tool
 * ini menerima kunci **hanya** untuk mencocokkan signature, dan tetap tidak
 * mengambil JWKS atau menyimpulkan penerbit tepercaya.
 */
export default function JwtVerifyPage() {
  const [token, setToken] = useState("");
  const [algorithm, setAlgorithm] = useState<JwtAlgorithm>("HS256");
  const [key, setKey] = useState("");
  const [expectedIssuer, setExpectedIssuer] = useState("");
  const [expectedAudience, setExpectedAudience] = useState("");
  const [check, setCheck] = useState<SignatureCheck | null>(null);
  const [busy, setBusy] = useState(false);

  const parts = useMemo(() => (token.trim() === "" ? null : readJwt(token)), [token]);

  const payloadJson = parts?.ok ? JSON.stringify(parts.value.payload, null, 2) : "";

  const claims = useMemo(
    () =>
      parts?.ok
        ? auditClaims(parts.value.payload, {
            expectedIssuer: expectedIssuer.trim() || undefined,
            expectedAudience: expectedAudience.trim() || undefined,
          })
        : [],
    [parts, expectedIssuer, expectedAudience],
  );

  /** Satu aksi utama: verifikasi (decode sudah otomatis mengikuti input). */
  const run = useCallback(async (): Promise<void> => {
    if (!parts?.ok) {
      setCheck({
        verdict: "error",
        message: parts ? parts.error.message : "Tempel token terlebih dahulu.",
        algorithmInToken: null,
        algorithmUsed: null,
      });
      return;
    }
    setBusy(true);
    setCheck(await verifyJwtSignature(parts.value, { algorithm, key }));
    setBusy(false);
  }, [algorithm, key, parts]);

  const useAlgorithmFromToken = (): void => {
    const tokenAlg = parts?.ok ? parts.value.algorithm : null;
    if (tokenAlg && isJwtAlgorithm(tokenAlg)) setAlgorithm(tokenAlg);
  };

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <Button variant="primary" onClick={() => void run()} disabled={busy || token.trim() === ""}>
            {busy ? "Memeriksa…" : "Verifikasi"}
          </Button>
          <SelectField
            id="jwt-verify-alg"
            label="Algoritma kunci"
            value={algorithm}
            options={ALGORITHM_OPTIONS}
            onChange={setAlgorithm}
          />
          <Button onClick={useAlgorithmFromToken} disabled={!parts?.ok}>
            Pakai alg dari token
          </Button>
          <span className="toolbar-spacer" />
          <CopyButton text={payloadJson} context="payload" />
          <ResetButton
            onReset={() => {
              setToken("");
              setKey("");
              setCheck(null);
            }}
            disabled={token === "" && key === ""}
          />
        </>
      }
    >
      <Panel
        label="Token & kunci"
        stacked
        tone={check && check.verdict !== "valid" ? "error" : "default"}
        footer="Kunci hanya dipakai di tab ini; tidak disimpan, tidak dikirim ke mana pun."
      >
        <CodeArea
          label="Token JWT yang akan diverifikasi"
          value={token}
          onChange={(value) => {
            setToken(value);
            setCheck(null);
          }}
          placeholder="header.payload.signature"
          hint="Tempel token JWS (3 bagian). Decode langsung terlihat di bawah; tekan Verifikasi untuk memeriksa signature."
          rows={4}
        />
        <div className="field-body field-body--inline">
          <FieldLabel htmlFor="jwt-verify-key">Kunci verifikasi</FieldLabel>
          <textarea
            id="jwt-verify-key"
            className="code-area code-area--key"
            rows={algorithm.startsWith("HS") ? 2 : 6}
            spellCheck={false}
            value={key}
            placeholder={
              algorithm.startsWith("HS")
                ? "secret HMAC (teks biasa)"
                : "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----"
            }
            aria-describedby="jwt-verify-key-hint"
            onChange={(event) => {
              setKey(event.target.value);
              setCheck(null);
            }}
          />
          <span id="jwt-verify-key-hint" className="sr-only">
            Untuk HMAC tempel secret; untuk RSA/ECDSA/EdDSA tempel kunci publik PEM.
          </span>
        </div>
      </Panel>

      <div className="tool-grid">
        <Panel
          label="Hasil verifikasi"
          tone={check?.verdict === "invalid" ? "error" : "default"}
          footer={check ? VERDICT_LABEL[check.verdict] : "belum diperiksa"}
        >
          {check ? (
            <div className="verify-body">
              <StatusMessage tone={check.verdict === "valid" ? "success" : "error"}>
                <strong>{VERDICT_LABEL[check.verdict]}.</strong> {check.message}
              </StatusMessage>
              {check.algorithmInToken ? (
                <p className="hint-text hint-text--tight">
                  Algoritma di header: <code>{check.algorithmInToken}</code>
                  {check.algorithmUsed ? (
                    <>
                      {" "}· kunci dipakai sebagai: <code>{check.algorithmUsed}</code>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="hint-text hint-text--tight verify-body">
              Tempel token dan kunci, lalu tekan <strong>Verifikasi</strong>. Tool ini tidak
              mengambil JWKS dan tidak memastikan penerbit token tepercaya.
            </p>
          )}
        </Panel>

        <Panel
          label="Klaim"
          footer={`${claims.length} klaim diperiksa · dibandingkan dengan jam perangkat`}
        >
          {claims.length === 0 ? (
            <p className="hint-text hint-text--tight verify-body">
              Klaim standar (exp, nbf, iat, iss, aud) akan diperiksa setelah token terbaca.
            </p>
          ) : (
            <ul className="claim-list">
              {claims.map((claim) => (
                <li key={claim.claim} className="claim-item">
                  <span className="claim-name">{claim.claim}</span>
                  <span className="claim-value">{claim.value}</span>
                  <span className={CLAIM_TONE[claim.state]}>{claim.note}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="field-body field-body--inline">
            <FieldLabel htmlFor="jwt-verify-iss">Issuer yang diharapkan</FieldLabel>
            <input
              id="jwt-verify-iss"
              type="text"
              value={expectedIssuer}
              placeholder="https://auth.contoh.com"
              onChange={(event) => setExpectedIssuer(event.target.value)}
            />
            <FieldLabel htmlFor="jwt-verify-aud">Audience yang diharapkan</FieldLabel>
            <input
              id="jwt-verify-aud"
              type="text"
              value={expectedAudience}
              placeholder="api-saya"
              onChange={(event) => setExpectedAudience(event.target.value)}
            />
          </div>
        </Panel>
      </div>
    </ToolLayout>
  );
}

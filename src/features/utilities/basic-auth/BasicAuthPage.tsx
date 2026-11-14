import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/editor/ToolLayout";
import { Panel } from "@/components/editor/Panel";
import { CodeArea } from "@/components/editor/CodeArea";
import { CopyButton } from "@/components/common/CopyButton";
import { ResetButton } from "@/components/common/ResetButton";
import { Button } from "@/components/common/Button";
import { FieldLabel } from "@/components/common/Field";
import { ErrorMessage, StatusMessage } from "@/components/common/StatusMessage";
import { decodeBasicAuth, encodeBasicAuth } from "@/lib/dev/auth";
import { getTool } from "@/registry/tools";

const TOOL = getTool("basic-auth")!;



/**
 * Basic Auth (ADR-0018): satu panel, dua arah.
 *
 * "Buat header" mengisi header Authorization dari username+password; "Baca
 * header" mengisi username+password dari header. Semua hasil masuk ke form yang
 * sama (ADR-0014), jadi tidak ada panel hasil kedua dan tidak ada copy per baris.
 */
export default function BasicAuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [header, setHeader] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const encoded = useMemo(() => encodeBasicAuth({ username, password }), [username, password]);

  const encodeInto = (): void => {
    setError(null);
    if (!encoded.ok) {
      setError(encoded.error.message);
      setStatus(null);
      return;
    }
    setHeader(encoded.value);
    setStatus("Header Authorization sudah terisi di form ini.");
  };

  const decodeInto = (): void => {
    setError(null);
    const result = decodeBasicAuth(header);
    if (!result.ok) {
      setError(result.error.message);
      setStatus(null);
      return;
    }
    setUsername(result.value.username);
    setPassword(result.value.password);
    setStatus("Username dan password sudah terisi di form ini.");
  };

  const reset = (): void => {
    setUsername("");
    setPassword("");
    setHeader("");
    setError(null);
    setStatus(null);
  };

  return (
    <ToolLayout
      tool={TOOL}
      toolbar={
        <>
          <div className="action-group" role="group" aria-label="Arah konversi">
            <Button variant="primary" onClick={encodeInto} disabled={username === "" && password === ""}>
              Buat header
            </Button>
            <Button onClick={decodeInto} disabled={header.trim() === ""}>
              Baca header
            </Button>
          </div>
          <span className="toolbar-spacer" />
          <CopyButton
            text={header}
            context="header Authorization"
            disabled={header.trim() === ""}
          />
          <ResetButton onReset={reset} disabled={username === "" && password === "" && header === ""} />
        </>
      }
    >
      <Panel
        label="Header Authorization"
        tone={error ? "error" : "default"}
        footer={
          header.trim() === ""
            ? "belum ada header"
            : `${header.length} karakter · Base64 dari username:password`
        }
      >
        <CodeArea
          label="Header Authorization"
          value={header}
          onChange={(value) => {
            setHeader(value);
            setError(null);
          }}
          placeholder="Authorization: Basic cmFuaTpzM2NyZXQ="
          hint="Tempel header atau nilainya saja, lalu tekan Baca header untuk mengisi username dan password."
          rows={4}
        />
        <div className="field-body field-body--inline">
          <FieldLabel htmlFor="basic-username">Username</FieldLabel>
          <input
            id="basic-username"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={username}
            placeholder="rani"
            onChange={(event) => setUsername(event.target.value)}
          />
          <FieldLabel htmlFor="basic-password">Password</FieldLabel>
          <input
            id="basic-password"
            type="password"
            autoComplete="off"
            value={password}
            placeholder="s3cret"
            aria-describedby="basic-password-hint"
            onChange={(event) => setPassword(event.target.value)}
          />
          <span id="basic-password-hint" className="sr-only">
            Basic Auth hanya Base64, bukan enkripsi: kata sandi tetap terbaca siapa pun yang
            memegang header. Selalu pakai HTTPS.
          </span>
        </div>
      </Panel>

      {error ? (
        <div className="result-block">
          <ErrorMessage error={{ kind: "parse", message: error }} />
        </div>
      ) : null}

      {status && !error ? (
        <div className="result-block">
          <StatusMessage tone="success">{status}</StatusMessage>
        </div>
      ) : null}
    </ToolLayout>
  );
}

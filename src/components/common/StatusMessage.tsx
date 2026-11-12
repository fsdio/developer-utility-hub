import type { ReactNode } from "react";
import type { ToolError } from "@/types/result";

type Tone = "info" | "success" | "error";

export function StatusMessage({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      className={`status status--${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <div>{children}</div>
    </div>
  );
}

export function ErrorMessage({ error }: { error: ToolError }) {
  return (
    <StatusMessage tone="error">
      <span>{error.message}</span>
      {error.detail ? <pre>{error.detail}</pre> : null}
    </StatusMessage>
  );
}

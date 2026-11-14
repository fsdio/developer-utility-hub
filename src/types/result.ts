/** Tipe hasil bersama untuk semua engine (technical-design §5). */

export interface ToolError {
  /** Pesan untuk manusia, bahasa Indonesia. */
  message: string;
  kind: "parse" | "limit" | "depth" | "internal" | "validation";
  line?: number;
  column?: number;
  /** Cuplikan teks dengan penanda posisi error. */
  detail?: string;
}

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: ToolError };
export type Result<T> = Ok<T> | Err;

export const ok = <T,>(value: T): Ok<T> => ({ ok: true, value });
export const err = (error: ToolError): Err => ({ ok: false, error });

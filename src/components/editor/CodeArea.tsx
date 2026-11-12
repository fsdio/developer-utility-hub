import { useId, type ChangeEvent } from "react";

interface CodeAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  spellCheck?: boolean;
  hint?: string;
  describedBy?: string;
  error?: boolean;
  maxLength?: number;
  rows?: number;
}

/**
 * Area teks utama tool.
 *
 * Label tidak dirender terlihat: judul panel di atasnya sudah menyebut isinya,
 * dan placeholder menjelaskan contoh nyata. Label tetap ada untuk pembaca layar
 * lewat `sr-only`, `hint` juga `sr-only` — tidak ada teks yang mengapit input
 * (ADR-0011). Area mengisi seluruh badan panel agar tidak ada ruang terbuang.
 */
export function CodeArea({
  label,
  value,
  onChange,
  placeholder,
  spellCheck = false,
  hint,
  describedBy,
  error = false,
  rows = 12,
}: CodeAreaProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="code-area"
        value={value}
        rows={rows}
        spellCheck={spellCheck}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder={placeholder}
        aria-invalid={error || undefined}
        aria-describedby={
          [hint ? hintId : "", describedBy ?? ""].filter(Boolean).join(" ") || undefined
        }
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      />
      {hint ? (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      ) : null}
    </>
  );
}

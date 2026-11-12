import { useId, type ChangeEvent } from "react";
import { FieldLabel } from "@/components/common/Field";

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
    <div style={{ display: "contents" }}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
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
        aria-describedby={[hint ? hintId : "", describedBy ?? ""].filter(Boolean).join(" ") || undefined}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      />
      {hint ? (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

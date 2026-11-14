import type { ReactNode, TextareaHTMLAttributes } from "react";

/* ────────────────────────────── Field wrapper ───────────────────────────── */

interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({ id, label, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="field" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

interface SelectFieldProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  /** Tampilkan label di samping kontrol (dipakai di luar toolbar). */
  visible?: boolean;
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  visible = false,
}: SelectFieldProps<T>) {
  return (
    <label className="field" htmlFor={id}>
      <span className={visible ? "field-text" : "sr-only"}>{label}</span>
      <span className="select-wrap">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

/**
 * Label untuk input di luar CodeArea. Secara default hanya untuk pembaca layar
 * (`sr-only`) karena judul panel sudah memberi konteks visual; teks di samping
 * atau di atas input membuat UI penuh tanpa menambah informasi (ADR-0011).
 * Pakai `visible` hanya bila tidak ada konteks visual lain.
 */
export function FieldLabel({
  htmlFor,
  children,
  visible = false,
}: {
  htmlFor: string;
  children: ReactNode;
  visible?: boolean;
}) {
  return (
    <label className={visible ? "field-label field-label--visible" : "sr-only"} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

/* ────────────────────────── Kontrol ber-gaya tunggal ─────────────────────── */

interface TextFieldProps {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  /** Nama aksesibel bila `label` hanya untuk pembaca layar (ADR-0011). */
  hiddenLabel?: boolean;
  placeholder?: string;
  hint?: ReactNode;
  error?: boolean;
  mono?: boolean;
  inputMode?: "text" | "numeric" | "decimal";
  autoComplete?: string;
  readOnly?: boolean;
  type?: "text" | "password" | "search";
}

/**
 * Input satu baris dengan label, hint, dan cincin fokus yang seragam.
 *
 * Semua tool memakai ini supaya tidak ada lagi `input` mentah yang jatuh ke
 * gaya bawaan browser (temuan: kontrol tanpa kelas tampil native, beda tinggi
 * dan beda warna dengan `select` di sebelahnya).
 */
export function TextField({
  id,
  label,
  value,
  onChange,
  hiddenLabel = true,
  placeholder,
  hint,
  error = false,
  mono = true,
  inputMode,
  autoComplete = "off",
  readOnly = false,
  type = "text",
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="control">
      <FieldLabel htmlFor={id} visible={!hiddenLabel}>
        {label}
      </FieldLabel>
      <input
        id={id}
        type={type}
        className={`control-input${mono ? " control-input--mono" : ""}`}
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        readOnly={readOnly}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={error || undefined}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  error?: boolean;
}

/** Textarea multi-baris (mis. kunci PEM) dengan gaya kontrol yang sama. */
export function TextAreaField({
  id,
  label,
  value,
  onChange,
  hint,
  error = false,
  rows = 4,
  ...rest
}: TextAreaFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="control">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        {...rest}
        id={id}
        rows={rows}
        className="control-input control-input--mono control-input--area"
        value={value}
        spellCheck={false}
        aria-invalid={error || undefined}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

import type { ReactNode } from "react";

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
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <label className="field" htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
    <label className={visible ? "field-label" : "sr-only"} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

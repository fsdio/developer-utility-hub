import type { ReactNode } from "react";

interface PanelProps {
  label: string;
  actions?: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "error";
  /** Menumpuk isi panel secara vertikal agar strip hasil bisa menempel di bawah input. */
  stacked?: boolean;
  children: ReactNode;
}

export function Panel({
  label,
  actions,
  footer,
  tone = "default",
  stacked = false,
  children,
}: PanelProps) {
  return (
    <section
      className={`panel${tone === "error" ? " panel--error" : ""}${stacked ? " panel--with-result" : ""}`}
    >
      <div className="panel-head">
        <span>{label}</span>
        {actions ? <span>{actions}</span> : null}
      </div>
      <div className="panel-body">{children}</div>
      {footer ? <div className="panel-foot">{footer}</div> : null}
    </section>
  );
}

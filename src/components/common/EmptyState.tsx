import type { ReactNode } from "react";

interface EmptyStateProps {
  children: ReactNode;
  example?: { label: string; onUse: () => void };
}

export function EmptyState({ children, example }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p>{children}</p>
      {example ? (
        <button type="button" className="button button--ghost" onClick={example.onUse}>
          {example.label}
        </button>
      ) : null}
    </div>
  );
}

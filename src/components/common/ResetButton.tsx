import { Button } from "@/components/common/Button";

interface ResetButtonProps {
  onReset: () => void;
  disabled?: boolean;
}

export function ResetButton({ onReset, disabled }: ResetButtonProps) {
  return (
    <Button onClick={onReset} disabled={disabled}>
      Reset
    </Button>
  );
}

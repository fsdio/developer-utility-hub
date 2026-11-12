import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { ThemeProvider } from "@/hooks/useTheme";

export function renderWithTheme(ui: ReactElement): RenderResult {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

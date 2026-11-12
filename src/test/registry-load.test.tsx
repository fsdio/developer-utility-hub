import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TOOLS } from "@/registry/tools";
import { ThemeProvider } from "@/hooks/useTheme";

/**
 * Setiap `load()` di registry harus benar-benar menghasilkan komponen yang
 * dapat dirender. Test ini menjaga agar aksesibilitas & privasi tidak hanya
 * diuji pada halaman yang kebetulan diimpor manual di file test lain.
 */
describe("registry load", () => {
  it.each(TOOLS.map((tool) => [tool.id, tool] as const))(
    "%s memuat komponen yang bisa dirender",
    async (_id, tool) => {
      expect(tool.load).toBeTypeOf("function");
      const module = await tool.load!();
      expect(module.default).toBeTypeOf("function");

      const Page = module.default;
      const { container } = render(
        <ThemeProvider>
          <Page />
        </ThemeProvider>,
      );

      expect(container.querySelector("h1")?.textContent?.length ?? 0).toBeGreaterThan(0);
      // Halaman tool selalu menyertakan catatan keterbatasan.
      expect(screen.getByText(/Catatan keterbatasan/i)).toBeInTheDocument();
    },
  );
});

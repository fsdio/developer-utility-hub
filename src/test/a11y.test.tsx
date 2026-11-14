import { describe, expect, it } from "vitest";
import { axe } from "jest-axe";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { HomePage } from "@/features/home/HomePage";
import CaseConverterPage from "@/features/text/case-converter/CaseConverterPage";
import JsonFormatterPage from "@/features/data/json-formatter/JsonFormatterPage";
import TextDiffPage from "@/features/comparison/text-diff/TextDiffPage";
import JsonDiffPage from "@/features/comparison/json-diff/JsonDiffPage";
import { PrivacyPage } from "@/features/privacy/PrivacyPage";
import Base64Page from "@/features/utilities/base64/Base64Page";
import UrlEncoderPage from "@/features/utilities/url-encoder/UrlEncoderPage";
import HtmlEntityPage from "@/features/utilities/html-entity/HtmlEntityPage";
import EscapePage from "@/features/utilities/escape/EscapePage";
import UuidPage from "@/features/utilities/uuid/UuidPage";
import HashPage from "@/features/utilities/hash/HashPage";
import TimestampPage from "@/features/utilities/timestamp/TimestampPage";
import ColorPage from "@/features/utilities/color/ColorPage";
import NumberBasePage from "@/features/utilities/number-base/NumberBasePage";
import JwtPage from "@/features/utilities/jwt/JwtPage";
import JwtVerifyPage from "@/features/utilities/jwt-verify/JwtVerifyPage";
import BasicAuthPage from "@/features/utilities/basic-auth/BasicAuthPage";
import ApiKeyPage from "@/features/utilities/api-key/ApiKeyPage";
import { AppShell } from "@/components/layout/AppShell";

const pages: Array<[string, () => React.ReactElement]> = [
  ["beranda", () => <HomePage />],
  ["case converter", () => <CaseConverterPage />],
  ["json formatter", () => <JsonFormatterPage />],
  ["text diff", () => <TextDiffPage />],
  ["json diff", () => <JsonDiffPage />],
  ["privacy", () => <PrivacyPage />],
  ["base64", () => <Base64Page />],
  ["url encoder", () => <UrlEncoderPage />],
  ["html entity", () => <HtmlEntityPage />],
  ["escape", () => <EscapePage />],
  ["uuid", () => <UuidPage />],
  ["hash", () => <HashPage />],
  ["timestamp", () => <TimestampPage />],
  ["color", () => <ColorPage />],
  ["number base", () => <NumberBasePage />],
  ["jwt", () => <JwtPage />],
  ["jwt verify", () => <JwtVerifyPage />],
  ["basic auth", () => <BasicAuthPage />],
  ["api key", () => <ApiKeyPage />],
];

describe("aksesibilitas (axe)", () => {
  it.each(pages)("%s tidak memiliki pelanggaran level A/AA", async (_name, render) => {
    const { container } = renderWithTheme(render());
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("AppShell menyediakan skip link dan landmark utama", () => {
    renderWithTheme(
      <AppShell>
        <h1>Judul</h1>
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: /Langsung ke konten/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("ThemeToggle mengumumkan state tema berikutnya", async () => {
    const { useTheme } = await import("@/hooks/useTheme");
    function Probe() {
      const { choice } = useTheme();
      return <span data-testid="choice">{choice}</span>;
    }
    renderWithTheme(<Probe />);
    expect(screen.getByTestId("choice").textContent).toBe("system");
  });
});

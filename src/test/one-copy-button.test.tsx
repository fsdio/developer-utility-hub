import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { renderWithTheme } from "@/test/renderWithTheme";

import CaseConverterPage from "@/features/text/case-converter/CaseConverterPage";
import JsonFormatterPage from "@/features/data/json-formatter/JsonFormatterPage";
import XmlFormatterPage from "@/features/data/xml-formatter/XmlFormatterPage";
import TextDiffPage from "@/features/comparison/text-diff/TextDiffPage";
import JsonDiffPage from "@/features/comparison/json-diff/JsonDiffPage";
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
import ImageBase64Page from "@/features/utilities/image-base64/ImageBase64Page";
import PdfBase64Page from "@/features/utilities/pdf-base64/PdfBase64Page";

const PAGES: Array<[string, () => ReactElement]> = [
  ["case-converter", () => <CaseConverterPage />],
  ["json-formatter", () => <JsonFormatterPage />],
  ["xml-formatter", () => <XmlFormatterPage />],
  ["text-diff", () => <TextDiffPage />],
  ["json-diff", () => <JsonDiffPage />],
  ["base64", () => <Base64Page />],
  ["url-encoder", () => <UrlEncoderPage />],
  ["html-entity", () => <HtmlEntityPage />],
  ["escape", () => <EscapePage />],
  ["uuid", () => <UuidPage />],
  ["hash", () => <HashPage />],
  ["timestamp", () => <TimestampPage />],
  ["color", () => <ColorPage />],
  ["number-base", () => <NumberBasePage />],
  ["jwt", () => <JwtPage />],
  ["image-base64", () => <ImageBase64Page />],
  ["pdf-base64", () => <PdfBase64Page />],
];

/**
 * ADR-0014: minimal action untuk klien — satu tombol salin per halaman.
 * Guard ini menangkap regresi ke pola copy-per-baris.
 */
describe("satu tombol salin per halaman (ADR-0014)", () => {
  for (const [id, render] of PAGES) {
    it(`${id} tidak punya lebih dari satu tombol salin`, () => {
      renderWithTheme(render());
      const copyButtons = screen.queryAllByRole("button", { name: /ke clipboard/i });
      expect(copyButtons.length).toBeLessThanOrEqual(1);
    });
  }
});

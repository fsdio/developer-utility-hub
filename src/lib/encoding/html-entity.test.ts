import { describe, expect, it } from "vitest";
import { decodeHtmlEntities, encodeHtmlEntities } from "@/lib/encoding/html-entity";

describe("encodeHtmlEntities", () => {
  it("meng-encode lima karakter berbahaya", () => {
    expect(encodeHtmlEntities(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });

  it("tidak mengubah karakter aman", () => {
    expect(encodeHtmlEntities("café ☕ 123")).toBe("café ☕ 123");
  });
});

describe("decodeHtmlEntities", () => {
  it("decode round-trip", () => {
    const original = `<div class="a">Tom & Jerry's</div>`;
    expect(decodeHtmlEntities(encodeHtmlEntities(original))).toBe(original);
  });

  it("menangani entity bernama", () => {
    expect(decodeHtmlEntities("&copy; &mdash; &hellip; &nbsp;")).toBe("© — … \u00a0");
  });

  it("menangani entity numerik desimal dan heksadesimal", () => {
    expect(decodeHtmlEntities("&#169; &#x1F600; &#X41;")).toBe("© 😀 A");
  });

  it("membiarkan entity tak dikenal apa adanya", () => {
    expect(decodeHtmlEntities("&tidakdikenal; &amp;")).toBe("&tidakdikenal; &");
  });

  it("mengabaikan code point di luar rentang", () => {
    expect(decodeHtmlEntities("&#x110000;")).toBe("&#x110000;");
  });

  it("tidak salah menafsirkan ampersand tanpa entity", () => {
    expect(decodeHtmlEntities("a & b")).toBe("a & b");
  });
});

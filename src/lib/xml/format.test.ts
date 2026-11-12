import { describe, expect, it } from "vitest";
import { formatXml, minifyXml, parserErrorMessage, validateXml } from "@/lib/xml/format";

const parse = (text: string): Document =>
  new DOMParser().parseFromString(text, "application/xml");

describe("formatXml", () => {
  it("mengindentasi elemen bertingkat", () => {
    const result = formatXml("<root><a><b>x</b></a></root>", parse, { indent: 2 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.text).toBe(
        "<root>\n  <a>\n    <b>x</b>\n  </a>\n</root>",
      );
    }
  });

  it("menghormati indent 4 dan tab", () => {
    const four = formatXml("<r><a>x</a></r>", parse, { indent: 4 });
    expect(four.ok && four.value.text).toBe("<r>\n    <a>x</a>\n</r>");
    const tab = formatXml("<r><a>x</a></r>", parse, { indent: "tab" });
    expect(tab.ok && tab.value.text).toBe("<r>\n\t<a>x</a>\n</r>");
  });

  it("mempertahankan komentar bila opsi aktif (default)", () => {
    const result = formatXml("<r><!-- catatan --><a>x</a></r>", parse);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.text).toContain("<!-- catatan -->");
  });

  it("membuang komentar bila opsi dimatikan", () => {
    const result = formatXml("<r><!-- catatan --><a>x</a></r>", parse, { preserveComments: false });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.text).not.toContain("catatan");
  });

  it("mempertahankan processing instruction", () => {
    const xml = '<?xml-stylesheet type="text/css" href="a.css"?><r><a>x</a></r>';
    const result = formatXml(xml, parse);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.text).toContain("<?xml-stylesheet");
  });

  it("mempertahankan atribut sesuai urutan asli", () => {
    const result = formatXml('<r b="2" a="1"></r>', parse);
    expect(result.ok && result.value.text).toBe('<r b="2" a="1" />');
  });

  it("menulis ulang CDATA sebagai teks ter-escape (ADR-0003)", () => {
    const result = formatXml("<r><![CDATA[a & b]]></r>", parse);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.text).toBe("<r>a &amp; b</r>");
  });

  it("tidak mengubah makna mixed content", () => {
    const result = formatXml("<p>Halo <b>dunia</b>!</p>", parse);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.text).toBe("<p>Halo <b>dunia</b>!</p>");
  });

  it("meng-escape karakter khusus pada teks", () => {
    const result = formatXml("<r>a &amp; b &lt; c</r>", parse);
    expect(result.ok && result.value.text).toBe("<r>a &amp; b &lt; c</r>");
  });

  it("melaporkan XML tidak well-formed dengan lokasi", () => {
    const result = formatXml("<r><a></r>", parse);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("parse");
      expect(result.error.message).toContain("well-formed");
    }
  });

  it("menolak input kosong", () => {
    const result = formatXml("   ", parse);
    expect(result.ok).toBe(false);
  });

  it("menghitung elemen dan root", () => {
    const result = formatXml("<a><b/><c/></a>", parse);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rootName).toBe("a");
      expect(result.value.elementCount).toBe(3);
    }
  });
});

describe("minifyXml", () => {
  it("membuang whitespace antar elemen", () => {
    const xml = "<r>\n  <a>x</a>\n  <b>y</b>\n</r>";
    const result = minifyXml(xml, parse);
    expect(result.ok && result.value.text).toBe("<r><a>x</a><b>y</b></r>");
  });

  it("mempertahankan whitespace di dalam teks bermakna", () => {
    const result = minifyXml("<r><a>hello world</a></r>", parse);
    expect(result.ok && result.value.text).toBe("<r><a>hello world</a></r>");
  });

  it("membuang komentar bila opsi dimatikan", () => {
    const result = minifyXml("<r><!--x--><a>y</a></r>", parse, { preserveComments: false });
    expect(result.ok && result.value.text).toBe("<r><a>y</a></r>");
  });
});

describe("validateXml", () => {
  it("menerima dokumen well-formed", () => {
    const result = validateXml("<r><a/></r>", parse);
    expect(result.ok).toBe(true);
  });

  it("menolak dokumen rusak", () => {
    expect(validateXml("<r><a></r>", parse).ok).toBe(false);
  });
});

describe("parserErrorMessage", () => {
  it("mengekstrak baris dan kolom bila ada", () => {
    const error = parserErrorMessage("XML Parsing Error: not well-formed\nLine: 3, Column: 7");
    expect(error.line).toBe(3);
    expect(error.column).toBe(7);
    expect(error.message).toContain("baris 3");
  });

  it("tetap berguna tanpa informasi lokasi", () => {
    const error = parserErrorMessage("kesalahan umum");
    expect(error.line).toBeUndefined();
    expect(error.message).toContain("well-formed");
  });
});

import { describe, expect, it } from "vitest";
import { CASE_STYLES, convert, convertAll, tokenize } from "@/lib/text/case";

describe("tokenize (ADR-0001)", () => {
  it("memisahkan separator umum", () => {
    expect(tokenize("hello world")).toEqual(["hello", "world"]);
    expect(tokenize("my_file-name.txt")).toEqual(["my", "file", "name", "txt"]);
  });

  it("memisahkan batas lower→UPPER", () => {
    expect(tokenize("userID")).toEqual(["user", "id"]);
  });

  it("memisahkan UPPER-run sebelum Upper+lower", () => {
    expect(tokenize("HTTPResponse")).toEqual(["http", "response"]);
    expect(tokenize("XMLHttpRequest")).toEqual(["xml", "http", "request"]);
  });

  it("memisahkan digit→letter tetapi tidak letter→digit", () => {
    expect(tokenize("v2Api")).toEqual(["v2", "api"]);
    expect(tokenize("sha256sum")).toEqual(["sha256", "sum"]);
    expect(tokenize("utf8")).toEqual(["utf8"]);
  });

  it("mempertahankan diakritik tanpa normalisasi", () => {
    expect(tokenize("café au lait")).toEqual(["café", "au", "lait"]);
  });

  it("mengabaikan token kosong akibat separator berulang", () => {
    expect(tokenize("  a__b--c  ")).toEqual(["a", "b", "c"]);
  });
});

describe("convert — kasus uji wajib PRD §6.1", () => {
  const cases: Array<{
    input: string;
    camel: string;
    pascal: string;
    snake: string;
    kebab: string;
    constant: string;
  }> = [
    {
      input: "hello world",
      camel: "helloWorld",
      pascal: "HelloWorld",
      snake: "hello_world",
      kebab: "hello-world",
      constant: "HELLO_WORLD",
    },
    {
      input: "userID",
      camel: "userId",
      pascal: "UserId",
      snake: "user_id",
      kebab: "user-id",
      constant: "USER_ID",
    },
    {
      input: "HTTPResponse",
      camel: "httpResponse",
      pascal: "HttpResponse",
      snake: "http_response",
      kebab: "http-response",
      constant: "HTTP_RESPONSE",
    },
    {
      input: "v2Api",
      camel: "v2Api",
      pascal: "V2Api",
      snake: "v2_api",
      kebab: "v2-api",
      constant: "V2_API",
    },
    {
      input: "sha256sum",
      camel: "sha256Sum",
      pascal: "Sha256Sum",
      snake: "sha256_sum",
      kebab: "sha256-sum",
      constant: "SHA256_SUM",
    },
  ];

  it.each(cases)("$input", ({ input, camel, pascal, snake, kebab, constant }) => {
    const result = convertAll(input);
    expect(result.camel).toBe(camel);
    expect(result.pascal).toBe(pascal);
    expect(result.snake).toBe(snake);
    expect(result.kebab).toBe(kebab);
    expect(result.constant).toBe(constant);
  });
});

describe("gaya berbasis teks asli", () => {
  it("UPPERCASE dan lowercase mempertahankan pemisah", () => {
    expect(convert("hello world_final", "uppercase")).toBe("HELLO WORLD_FINAL");
    expect(convert("Hello World_FINAL", "lowercase")).toBe("hello world_final");
  });

  it("Title Case mengapitalkan tiap kata", () => {
    expect(convert("hello WORLD from js", "title")).toBe("Hello World From Js");
  });

  it("Sentence case mengapitalkan awal kalimat", () => {
    expect(convert("halo dunia. apa kabar? baik!", "sentence")).toBe(
      "Halo dunia. Apa kabar? Baik!",
    );
  });
});

describe("edge case", () => {
  it("input kosong menghasilkan semua output kosong", () => {
    const result = convertAll("");
    for (const style of CASE_STYLES) expect(result[style]).toBe("");
  });

  it("input hanya separator menghasilkan kosong untuk gaya berbasis token", () => {
    const result = convertAll("---___");
    expect(result.camel).toBe("");
    expect(result.snake).toBe("");
  });

  it("idempoten untuk gaya snake dan kebab", () => {
    const once = convert("Hello World", "snake");
    expect(convert(once, "snake")).toBe(once);
    const kebab = convert("Hello World", "kebab");
    expect(convert(kebab, "kebab")).toBe(kebab);
  });

  it("menerima input yang sudah snake_case", () => {
    expect(convert("hello_world", "camel")).toBe("helloWorld");
  });

  it("menangani tanda baca campur", () => {
    expect(convert("Hello, World! (2026)", "snake")).toBe("hello_world_2026");
  });
});

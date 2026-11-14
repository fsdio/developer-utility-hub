import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error — modul .mjs tanpa deklarasi tipe (lihat scripts/site-base.mjs)
import { siteBase } from "../../scripts/site-base.mjs";

/** ADR-0016 — base path situs harus bisa dipindah tanpa menyunting kode. */
describe("siteBase", () => {
  const original = process.env.VITE_BASE_PATH;
  afterEach(() => {
    if (original === undefined) delete process.env.VITE_BASE_PATH;
    else process.env.VITE_BASE_PATH = original;
  });

  it("default ke root untuk custom domain", () => {
    delete process.env.VITE_BASE_PATH;
    expect(siteBase()).toBe("/");
  });

  it("menerima project page GitHub Pages", () => {
    process.env.VITE_BASE_PATH = "/developer-utility-hub/";
    expect(siteBase()).toBe("/developer-utility-hub/");
  });

  it("menambahkan garis miring akhir bila lupa", () => {
    process.env.VITE_BASE_PATH = "/developer-utility-hub";
    expect(siteBase()).toBe("/developer-utility-hub/");
  });

  it("string kosong diperlakukan sebagai root", () => {
    process.env.VITE_BASE_PATH = "";
    expect(siteBase()).toBe("/");
  });
});

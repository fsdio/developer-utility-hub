import { describe, expect, it } from "vitest";
import { decideVersion, parseVersionJson } from "@/lib/browser/sw-version";

describe("parseVersionJson", () => {
  it("membaca id dan waktu build", () => {
    expect(parseVersionJson('{"id":"abc123","builtAt":"2026-11-12T00:00:00Z"}')).toEqual({
      id: "abc123",
      builtAt: "2026-11-12T00:00:00Z",
    });
  });

  it("menolak JSON rusak atau id kosong", () => {
    expect(parseVersionJson("{bukan json")).toBeNull();
    expect(parseVersionJson('{"id":""}')).toBeNull();
    expect(parseVersionJson('{"builtAt":"x"}')).toBeNull();
    expect(parseVersionJson("[]")).toBeNull();
  });
});

describe("decideVersion — penentu reload", () => {
  it("id sama berarti pakai cache browser", () => {
    expect(decideVersion("abc", "abc")).toBe("up-to-date");
  });

  it("id berbeda berarti muat ulang dari server", () => {
    expect(decideVersion("baru", "lama")).toBe("update");
  });

  it("klien baru (belum punya id) memuat dari server sekali", () => {
    expect(decideVersion("abc", null)).toBe("update");
  });

  it("server tak terjangkau berarti tetap pakai cache (offline)", () => {
    expect(decideVersion(null, "abc")).toBe("unknown");
    expect(decideVersion("", "abc")).toBe("unknown");
  });
});

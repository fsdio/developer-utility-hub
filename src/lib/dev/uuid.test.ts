import { describe, expect, it } from "vitest";
import { generateUuids, uuidV4, uuidV7 } from "@/lib/dev/uuid";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const sequentialRandom = (): ((length: number) => Uint8Array) => {
  let counter = 0;
  return (length: number) => {
    const bytes = new Uint8Array(length);
    for (let index = 0; index < length; index += 1) bytes[index] = counter++ % 256;
    return bytes;
  };
};

describe("uuidV4", () => {
  it("berformat UUID dan menandai versi 4 + varian RFC 4122", () => {
    const uuid = uuidV4();
    expect(uuid).toMatch(UUID_RE);
    expect(uuid[14]).toBe("4");
    expect(["8", "9", "a", "b"]).toContain(uuid[19]);
  });

  it("menghasilkan nilai berbeda untuk acak berbeda", () => {
    expect(uuidV4()).not.toBe(uuidV4());
  });

  it("deterministik dengan sumber acak tetap", () => {
    const random = sequentialRandom();
    const first = uuidV4(random);
    const second = uuidV4(sequentialRandom());
    expect(first).toBe(second);
  });
});

describe("uuidV7", () => {
  it("berformat UUID dengan versi 7", () => {
    const uuid = uuidV7();
    expect(uuid).toMatch(UUID_RE);
    expect(uuid[14]).toBe("7");
  });

  it("menyandikan timestamp milidetik di 48 bit awal", () => {
    const now = 1_700_000_000_000;
    const uuid = uuidV7(sequentialRandom(), now);
    const hexTimestamp = uuid.replace(/-/g, "").slice(0, 12);
    expect(Number.parseInt(hexTimestamp, 16)).toBe(now);
  });

  it("nilai naik seiring waktu (time-ordered)", () => {
    const random = sequentialRandom();
    const earlier = uuidV7(random, 1_700_000_000_000);
    const later = uuidV7(random, 1_700_000_001_000);
    expect(later > earlier).toBe(true);
  });
});

describe("generateUuids", () => {
  it("menghormati jumlah yang diminta", () => {
    expect(generateUuids(5, 4)).toHaveLength(5);
    expect(generateUuids(3, 7)).toHaveLength(3);
  });

  it("membatasi jumlah maksimum 1000 dan minimum 1", () => {
    expect(generateUuids(5000, 4)).toHaveLength(1000);
    expect(generateUuids(0, 4)).toHaveLength(1);
  });

  it("tidak menghasilkan duplikat dalam satu batch", () => {
    const uuids = generateUuids(200, 4);
    expect(new Set(uuids).size).toBe(200);
  });
});

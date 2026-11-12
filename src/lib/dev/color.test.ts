import { describe, expect, it } from "vitest";
import { convertColor, rgbToHex, rgbToHsl, hslToRgb, relativeLuminance } from "@/lib/dev/color";

const convert = (input: string) => {
  const result = convertColor(input);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("convertColor — HEX input", () => {
  it("HEX 6 digit", () => {
    const value = convert("#2563eb");
    expect(value.rgb).toBe("rgb(37, 99, 235)");
    expect(value.hex).toBe("#2563eb");
  });

  it("HEX 3 digit diperluas", () => {
    expect(convert("#fff").hex).toBe("#ffffff");
  });

  it("HEX 8 digit memuat alpha", () => {
    const value = convert("#2563eb80");
    expect(value.hex).toBe("#2563eb80");
    expect(value.rgb).toContain("0.502");
  });

  it("tanpa tanda # juga diterima", () => {
    expect(convert("ff0000").hex).toBe("#ff0000");
  });
});

describe("convertColor — RGB dan HSL", () => {
  it("rgb() dibaca", () => {
    expect(convert("rgb(255, 0, 0)").hex).toBe("#ff0000");
  });

  it("rgba() mempertahankan alpha", () => {
    expect(convert("rgba(0, 0, 0, 0.5)").rgb).toBe("rgb(0, 0, 0, 0.5)");
  });

  it("rgb() dengan persen", () => {
    expect(convert("rgb(100%, 0%, 0%)").hex).toBe("#ff0000");
  });

  it("hsl() dibaca", () => {
    expect(convert("hsl(120, 100%, 50%)").hex).toBe("#00ff00");
  });

  it("hsl() dengan hue > 360 dinormalisasi", () => {
    expect(convert("hsl(480, 100%, 50%)").hex).toBe(convert("hsl(120, 100%, 50%)").hex);
  });
});

describe("konversi dibolak-balik", () => {
  it("rgb → hsl → rgb stabil", () => {
    for (const hex of ["#000000", "#ffffff", "#2563eb", "#7f8c8d", "#ff8800"]) {
      const { rgbValue, hslValue } = convert(hex);
      const back = hslToRgb(hslValue);
      expect(back.r).toBe(rgbValue.r);
      expect(back.g).toBe(rgbValue.g);
      expect(back.b).toBe(rgbValue.b);
    }
  });

  it("rgbToHex dan rgbToHsl konsisten", () => {
    const rgb = { r: 18, g: 52, b: 86, a: 1 };
    expect(rgbToHex(rgb)).toBe("#123456");
    const hsl = rgbToHsl(rgb);
    expect(hsl.h).toBeGreaterThanOrEqual(0);
    expect(hsl.h).toBeLessThan(360);
  });
});

describe("error dan keterbacaan", () => {
  it("menolak format tak dikenal dengan saran", () => {
    const result = convertColor("merah");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("#rrggbb");
  });

  it("menolak input kosong", () => {
    expect(convertColor("").ok).toBe(false);
  });

  it("menolak panjang HEX yang tidak valid", () => {
    const result = convertColor("#12345");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("3, 4, 6, atau 8");
  });

  it("menentukan warna teks yang terbaca di atas latar", () => {
    expect(convert("#ffffff").readableText).toBe("dark");
    expect(convert("#000000").readableText).toBe("light");
  });

  it("luminance relatif sesuai rentang WCAG", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255, a: 1 })).toBeCloseTo(1, 5);
    expect(relativeLuminance({ r: 0, g: 0, b: 0, a: 1 })).toBeCloseTo(0, 5);
  });
});

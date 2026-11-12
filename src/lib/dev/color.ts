/**
 * Color converter HEX / RGB / HSL — murni, tanpa DOM.
 */
import { err, ok, type Result } from "@/types/result";

export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
  a: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round = (value: number, digits = 0): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function parseColor(source: string): Result<Rgb> {
  const input = source.trim().toLowerCase();
  if (input === "") {
    return err({ kind: "parse", message: "Input masih kosong. Masukkan warna HEX, RGB, atau HSL." });
  }

  // HEX: #rgb, #rgba, #rrggbb, #rrggbbaa
  const hexMatch = /^#?([0-9a-f]{3,8})$/.exec(input);
  if (hexMatch?.[1]) {
    const hex = hexMatch[1];
    const expand = (value: string): number => Number.parseInt(value.length === 1 ? value + value : value, 16);
    if (hex.length === 3 || hex.length === 4) {
      return ok({
        r: expand(hex[0] ?? "0"),
        g: expand(hex[1] ?? "0"),
        b: expand(hex[2] ?? "0"),
        a: hex.length === 4 ? round(expand(hex[3] ?? "f") / 255, 3) : 1,
      });
    }
    if (hex.length === 6 || hex.length === 8) {
      return ok({
        r: expand(hex.slice(0, 2)),
        g: expand(hex.slice(2, 4)),
        b: expand(hex.slice(4, 6)),
        a: hex.length === 8 ? round(expand(hex.slice(6, 8)) / 255, 3) : 1,
      });
    }
    return err({ kind: "parse", message: "Panjang HEX harus 3, 4, 6, atau 8 digit." });
  }

  // rgb() / rgba()
  const rgbMatch = /^rgba?\(\s*([^)]+)\)$/.exec(input);
  if (rgbMatch?.[1]) {
    const parts = rgbMatch[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3 || parts.length > 4) {
      return err({ kind: "parse", message: "rgb() memerlukan 3 nilai (dan opsional alpha)." });
    }
    const channels = parts.slice(0, 3).map((part) => {
      if (part.endsWith("%")) return (Number.parseFloat(part) / 100) * 255;
      return Number.parseFloat(part);
    });
    if (channels.some((channel) => !Number.isFinite(channel))) {
      return err({ kind: "parse", message: "Nilai channel rgb() tidak valid." });
    }
    const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);
    return ok({
      r: Math.round(clamp(channels[0] ?? 0, 0, 255)),
      g: Math.round(clamp(channels[1] ?? 0, 0, 255)),
      b: Math.round(clamp(channels[2] ?? 0, 0, 255)),
      a: Number.isFinite(alpha) ? round(clamp(alpha, 0, 1), 3) : 1,
    });
  }

  // hsl() / hsla()
  const hslMatch = /^hsla?\(\s*([^)]+)\)$/.exec(input);
  if (hslMatch?.[1]) {
    const parts = hslMatch[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3 || parts.length > 4) {
      return err({ kind: "parse", message: "hsl() memerlukan 3 nilai (dan opsional alpha)." });
    }
    const hue = Number.parseFloat(parts[0] ?? "0");
    const saturation = Number.parseFloat(parts[1] ?? "0") / 100;
    const lightness = Number.parseFloat(parts[2] ?? "0") / 100;
    if (![hue, saturation, lightness].every((value) => Number.isFinite(value))) {
      return err({ kind: "parse", message: "Nilai hsl() tidak valid." });
    }
    const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);
    const rgb = hslToRgb({ h: hue, s: clamp(saturation, 0, 1), l: clamp(lightness, 0, 1), a: 1 });
    return ok({
      ...rgb,
      a: Number.isFinite(alpha) ? round(clamp(alpha, 0, 1), 3) : 1,
    });
  }

  return err({
    kind: "parse",
    message: "Format tidak dikenali. Gunakan #rgb, #rrggbb, rgb(r,g,b), rgba(...), atau hsl(...).",
  });
}

export function rgbToHex({ r, g, b, a }: Rgb): string {
  const part = (value: number): string => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  const base = `#${part(r)}${part(g)}${part(b)}`;
  return a < 1 ? `${base}${part(a * 255)}` : base;
}

export function rgbToHsl({ r, g, b, a }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === rn) hue = ((gn - bn) / delta) % 6;
    else if (max === gn) hue = (bn - rn) / delta + 2;
    else hue = (rn - gn) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return {
    h: round(hue, 1),
    s: round(saturation * 100, 1),
    l: round(lightness * 100, 1),
    a,
  };
}

/** Menerima saturasi/lightness dalam persen (0–100); rasio 0–1 juga diterima. */
export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hue = ((h % 360) + 360) % 360;
  const saturation = s > 1 ? s / 100 : s;
  const lightness = l > 1 ? l / 100 : l;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  const [r1, g1, b1] =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a: 1,
  };
}

/**
 * HEX 6 digit tanpa alpha untuk `<input type="color">`, yang tidak menerima
 * alpha. Alpha tetap disimpan di hasil konversi dan ditampilkan terpisah.
 */
export function hexForColorInput({ r, g, b }: Rgb): string {
  return rgbToHex({ r, g, b, a: 1 }).slice(0, 7);
}

export interface ColorConversion {
  hex: string;
  rgb: string;
  hsl: string;
  rgbValue: Rgb;
  hslValue: Hsl;
  /** Luminance relatif (WCAG) untuk memilih warna teks di atas latar ini. */
  readableText: "light" | "dark";
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number): number => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function convertColor(source: string): Result<ColorConversion> {
  const parsed = parseColor(source);
  if (!parsed.ok) return parsed;

  const rgbValue = parsed.value;
  const hslValue = rgbToHsl(rgbValue);
  const alpha = rgbValue.a < 1 ? `, ${rgbValue.a}` : "";
  const alphaHsl = hslValue.a < 1 ? `, ${hslValue.a}` : "";

  return ok({
    hex: rgbToHex(rgbValue),
    rgb: `rgb(${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b}${alpha})`,
    hsl: `hsl(${hslValue.h}, ${hslValue.s}%, ${hslValue.l}%${alphaHsl})`,
    rgbValue,
    hslValue,
    readableText: relativeLuminance(rgbValue) > 0.179 ? "dark" : "light",
  });
}

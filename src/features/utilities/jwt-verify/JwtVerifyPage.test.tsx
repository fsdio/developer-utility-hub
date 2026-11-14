import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import JwtVerifyPage from "@/features/utilities/jwt-verify/JwtVerifyPage";

/** Membuat JWS HS256 yang benar-benar ditandatangani WebCrypto. */
async function signHs256(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const b64 = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const input = `${b64(encoder.encode(JSON.stringify(header)))}.${b64(encoder.encode(JSON.stringify(payload)))}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(input));
  return `${input}.${b64(new Uint8Array(signature))}`;
}

describe("JwtVerifyPage", () => {
  it("memverifikasi token HS256 yang valid", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JwtVerifyPage />);

    const token = await signHs256({ sub: "u-1", exp: Math.floor(Date.now() / 1000) + 3600 }, "rahasia-uji");
    await user.click(screen.getByLabelText(/Token JWT/));
    await user.paste(token);
    await user.type(screen.getByLabelText(/Kunci verifikasi/), "rahasia-uji");
    await user.click(screen.getByRole("button", { name: "Verifikasi" }));

    await waitFor(() => expect(screen.getAllByText(/Signature cocok/i).length).toBeGreaterThan(0));
    // Klaim exp ikut diaudit di panel yang sama.
    expect(screen.getByText(/Masih berlaku/i)).toBeInTheDocument();
  });

  it("menandai signature tidak cocok saat secret salah", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JwtVerifyPage />);

    const token = await signHs256({ sub: "u-1", exp: Math.floor(Date.now() / 1000) + 60 }, "benar");
    await user.click(screen.getByLabelText(/Token JWT/));
    await user.paste(token);
    await user.type(screen.getByLabelText(/Kunci verifikasi/), "salah");
    await user.click(screen.getByRole("button", { name: "Verifikasi" }));

    await waitFor(() => expect(screen.getAllByText(/Signature tidak cocok/i).length).toBeGreaterThan(0));
  });

  it("memakai algoritma dari header token saat diminta", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JwtVerifyPage />);

    const token = await signHs256({ sub: "u-1" }, "kunci");
    await user.click(screen.getByLabelText(/Token JWT/));
    await user.paste(token);
    await user.click(screen.getByRole("button", { name: /Pakai alg dari token/ }));

    expect((screen.getByLabelText("Algoritma kunci") as HTMLSelectElement).value).toBe("HS256");
  });

  it("menolak token yang tidak terbaca tanpa crash", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JwtVerifyPage />);

    await user.click(screen.getByLabelText(/Token JWT/));
    await user.paste("bukan.token.jwt");
    await user.click(screen.getByRole("button", { name: "Verifikasi" }));

    await waitFor(() =>
      expect(screen.getAllByText(/Belum bisa diverifikasi/i).length).toBeGreaterThan(0),
    );
  });
});

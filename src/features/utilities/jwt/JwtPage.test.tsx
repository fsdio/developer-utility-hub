import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import JwtPage from "@/features/utilities/jwt/JwtPage";

const b64url = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const token = (header: object, payload: object, sig = "c2ln") =>
  `${b64url(header)}.${b64url(payload)}.${sig}`;

describe("JwtPage", () => {
  it("menampilkan header dan payload", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JwtPage />);
    await user.click(screen.getByRole("textbox", { name: /akan di-decode/i }));
    await user.paste(token({ alg: "HS256", typ: "JWT" }, { sub: "123", name: "Rani" }));

    expect(await screen.findByText(/"name": "Rani"/)).toBeInTheDocument();
    expect(screen.getByText(/"alg": "HS256"/)).toBeInTheDocument();
  });

  it("selalu menampilkan peringatan signature tidak diverifikasi", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JwtPage />);
    await user.click(screen.getByRole("textbox", { name: /akan di-decode/i }));
    await user.paste(token({ alg: "RS256" }, { sub: "x" }));

    expect(await screen.findByText(/Signature tidak diverifikasi/i)).toBeInTheDocument();
    expect(screen.getAllByText(/tidak menerima secret atau public key/i).length).toBeGreaterThan(0);
  });

  it("tidak pernah menyebut token sebagai valid atau verified", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JwtPage />);
    await user.click(screen.getByRole("textbox", { name: /akan di-decode/i }));
    await user.paste(token({ alg: "HS256" }, { sub: "x", exp: 1_700_003_600 }));

    await screen.findByText(/"sub": "x"/);
    const pageText = document.body.textContent ?? "";
    expect(pageText).not.toMatch(/\btoken (valid|verified)\b/i);
    expect(pageText).not.toMatch(/signature (valid|verified)/i);
    expect(pageText).toMatch(/tidak diverifikasi/i);
  });

  it("memberi peringatan keras untuk alg none", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JwtPage />);
    await user.click(screen.getByRole("textbox", { name: /akan di-decode/i }));
    await user.paste(token({ alg: "none" }, { sub: "x" }, ""));

    expect(await screen.findByText(/alg “none”/i)).toBeInTheDocument();
    expect(screen.getByText(/tidak memiliki\s+signature sama sekali/i)).toBeInTheDocument();
  });

  it("menolak JWE 5 bagian dengan penjelasan", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JwtPage />);
    await user.click(screen.getByRole("textbox", { name: /akan di-decode/i }));
    await user.paste("aaaa.bbbb.cccc.dddd.eeee");
    expect(await screen.findByRole("alert")).toHaveTextContent(/JWE/i);
  });

  it("menampilkan status claim waktu tanpa kata validasi", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JwtPage />);
    await user.click(screen.getByRole("textbox", { name: /akan di-decode/i }));
    await user.paste(token({ alg: "HS256" }, { sub: "x", exp: 1 }));

    await waitFor(() =>
      expect(screen.getByText(/exp · kedaluwarsa \(menurut jam perangkat\)/i)).toBeInTheDocument(),
    );
  });
});

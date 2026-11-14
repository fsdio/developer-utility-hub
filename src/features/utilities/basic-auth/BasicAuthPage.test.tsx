import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import BasicAuthPage from "@/features/utilities/basic-auth/BasicAuthPage";

describe("BasicAuthPage", () => {
  it("membuat header Authorization dari kredensial", async () => {
    const user = userEvent.setup();
    renderWithTheme(<BasicAuthPage />);

    await user.type(screen.getByLabelText("Username"), "rani");
    await user.type(screen.getByLabelText("Password"), "s3cret");
    await user.click(screen.getByRole("button", { name: "Buat header" }));

    const area = screen.getByLabelText(/Header Authorization/) as HTMLTextAreaElement;
    // btoa("rani:s3cret") = cmFuaTpzM2NyZXQ=
    expect(area.value).toBe("Basic cmFuaTpzM2NyZXQ=");
  });

  it("membaca kredensial dari header yang ditempel", async () => {
    const user = userEvent.setup();
    renderWithTheme(<BasicAuthPage />);

    const area = screen.getByLabelText(/Header Authorization/);
    await user.click(area);
    await user.paste("Authorization: Basic cmFuaTpzM2NyZXQ=");
    await user.click(screen.getByRole("button", { name: "Baca header" }));

    expect((screen.getByLabelText("Username") as HTMLInputElement).value).toBe("rani");
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("s3cret");
  });

  it("melaporkan header yang tidak valid di panel yang sama", async () => {
    const user = userEvent.setup();
    renderWithTheme(<BasicAuthPage />);

    const area = screen.getByLabelText(/Header Authorization/);
    await user.click(area);
    await user.paste("Basic !!!bukan-base64!!!");
    await user.click(screen.getByRole("button", { name: "Baca header" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Base64/i);
  });
});

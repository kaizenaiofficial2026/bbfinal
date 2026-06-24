import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordInput from "@/components/PasswordInput";

describe("PasswordInput show/hide toggle", () => {
  it("starts masked and reveals/re-hides the value on toggle", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PasswordInput id="pw" name="password" autoComplete="new-password" />,
    );
    const input = container.querySelector("input") as HTMLInputElement;

    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("forwards name/autocomplete/required to the underlying input", () => {
    const { container } = render(
      <PasswordInput id="pw" name="password" required minLength={8} />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input).toHaveAttribute("name", "password");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("minlength", "8");
  });
});

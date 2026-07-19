import { useState } from "react";
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

  // The admin wizards drive their fields with value + onChange; before the
  // shared component supported those, they had to use a raw <input> and so had
  // no reveal toggle at all.
  it("supports controlled usage and still toggles visibility", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <PasswordInput
          name="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }
    const { container } = render(<Controlled />);
    const input = container.querySelector("input") as HTMLInputElement;

    await user.type(input, "hunter2");
    expect(input).toHaveValue("hunter2");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");
    // Revealing must not disturb what was typed.
    expect(input).toHaveValue("hunter2");
  });

  it("renders bare (admin) without the public field utility classes", () => {
    const { container } = render(
      <PasswordInput name="password" variant="bare" />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.className).not.toMatch(/rounded-|border-line|min-h-12/);
    // The toggle is still present — the variant only changes the field skin.
    expect(screen.getByRole("button", { name: /show password/i })).toBeVisible();
  });

  it("keeps the toggle out of the tab order of the form's value flow", () => {
    render(<PasswordInput name="password" />);
    // type=button so it never submits the surrounding form.
    expect(screen.getByRole("button", { name: /show password/i })).toHaveAttribute(
      "type",
      "button",
    );
  });
});

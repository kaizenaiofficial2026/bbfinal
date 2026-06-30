import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DirtySubmitButton } from "@/app/admin/_components/DirtySubmitButton";

describe("DirtySubmitButton (admin content forms)", () => {
  function renderForm() {
    return render(
      <form>
        <input name="title" defaultValue="Original" />
        <select name="status" defaultValue="draft">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <DirtySubmitButton>Save</DirtySubmitButton>
      </form>,
    );
  }

  it("is disabled on an unchanged form", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("enables once a field changes, and disables again when reverted", () => {
    renderForm();
    const button = screen.getByRole("button", { name: /save/i });
    const input = screen.getByDisplayValue("Original") as HTMLInputElement;

    fireEvent.input(input, { target: { value: "Changed" } });
    expect(button).toBeEnabled();

    fireEvent.input(input, { target: { value: "Original" } });
    expect(button).toBeDisabled();
  });

  it("enables when a select value changes", () => {
    renderForm();
    const button = screen.getByRole("button", { name: /save/i });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "published" },
    });
    expect(button).toBeEnabled();
  });
});

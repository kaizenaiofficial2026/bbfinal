import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Combobox, { type ComboboxOption } from "@/components/Combobox";

const COUNTRIES: ComboboxOption[] = [
  { value: "Sri Lanka", label: "Sri Lanka", iconCode: "LK", keywords: "LK" },
  { value: "India", label: "India", iconCode: "IN", keywords: "IN" },
  { value: "United States", label: "United States", iconCode: "US", keywords: "US" },
];

describe("Combobox", () => {
  it("filters the static list as you type and commits a selection with its flag", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Combobox name="country" label="Country" options={COUNTRIES} onChange={onChange} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "sri" } });

    const option = screen.getByRole("option", { name: /sri lanka/i });
    expect(option).toBeInTheDocument();
    const flag = option.querySelector("img.combobox-flag");
    expect(flag).not.toBeNull();
    expect(flag).toHaveAttribute("src", "/flags/lk.svg");

    fireEvent.mouseDown(option);

    expect(
      container.querySelector('input[type="hidden"][name="country"]'),
    ).toHaveValue("Sri Lanka");
    expect(onChange).toHaveBeenCalledWith(
      "Sri Lanka",
      expect.objectContaining({ value: "Sri Lanka", iconCode: "LK" }),
    );
  });

  it("does not commit an unmatched country (restores on close)", () => {
    const { container } = render(
      <Combobox name="country" label="Country" options={COUNTRIES} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Atlantis" } });
    fireEvent.mouseDown(document.body); // click away

    expect(
      container.querySelector('input[type="hidden"][name="country"]'),
    ).toHaveValue("");
    expect(input).toHaveValue("");
  });

  it("is disabled with a hint until enabled", () => {
    render(
      <Combobox
        name="city"
        label="City"
        loadOptions={vi.fn(async () => [])}
        disabled
        disabledHint="Select a country first"
      />,
    );
    const input = screen.getByRole("combobox");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("placeholder", "Select a country first");
  });

  it("loads async options on open and renders them", async () => {
    const loadOptions = vi.fn(async () => [{ value: "Colombo", label: "Colombo" }]);
    render(<Combobox name="city" label="City" loadOptions={loadOptions} />);
    fireEvent.focus(screen.getByRole("combobox"));

    await waitFor(() => expect(loadOptions).toHaveBeenCalled());
    expect(await screen.findByRole("option", { name: "Colombo" })).toBeInTheDocument();
  });

  it("live-syncs the posted value while typing (allowCustom) so it survives submit-from-elsewhere", () => {
    const { container } = render(
      <Combobox
        name="city"
        label="City"
        loadOptions={vi.fn(async () => [])}
        allowCustom
      />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Galle" } });
    // Hidden value reflects the typed text immediately, without needing a blur.
    expect(
      container.querySelector('input[type="hidden"][name="city"]'),
    ).toHaveValue("Galle");
  });

  it("keeps freely-typed text when allowCustom is set", async () => {
    const { container } = render(
      <Combobox
        name="city"
        label="City"
        loadOptions={vi.fn(async () => [])}
        allowCustom
      />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Galleville" } });
    fireEvent.mouseDown(document.body); // close

    await waitFor(() =>
      expect(
        container.querySelector('input[type="hidden"][name="city"]'),
      ).toHaveValue("Galleville"),
    );
  });
});

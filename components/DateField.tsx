"use client";

import { useState } from "react";
import DatePicker from "./DatePicker";

// Form-friendly wrapper around the custom DatePicker: keeps the selected ISO
// value in state and mirrors it into a hidden input so the date posts with the
// form (the picker itself is a controlled, button-based widget). A hidden input
// is display:none, so it never takes up a grid cell next to the picker.
export default function DateField({
  id,
  name,
  label,
  defaultValue = "",
  min,
  max,
  initialView,
  placeholder,
  error,
  fieldClassName,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  initialView?: string;
  placeholder?: string;
  error?: string;
  fieldClassName?: string;
  onChange?: (iso: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <>
      <DatePicker
        id={id}
        label={label}
        value={value}
        min={min}
        max={max}
        initialView={initialView}
        placeholder={placeholder}
        error={error}
        fieldClassName={fieldClassName}
        onChange={(iso) => {
          setValue(iso);
          onChange?.(iso);
        }}
      />
      <input type="hidden" name={name} value={value} />
    </>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  name: string;
  label: string;
  options: Array<string | SelectOption>;
  defaultValue?: string;
  className?: string;
};

export default function Select({
  name,
  label,
  options,
  defaultValue,
  className,
}: SelectProps) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );
  const labelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(
    () =>
      normalizedOptions.find((option) => option.value === defaultValue) ??
      normalizedOptions[0],
  );
  const [active, setActive] = useState(() => {
    const i = normalizedOptions.findIndex(
      (option) => option.value === (defaultValue ?? normalizedOptions[0].value),
    );
    return i < 0 ? 0 : i;
  });

  // close on outside click
  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const choose = (i: number) => {
    setSelected(normalizedOptions[i]);
    setActive(i);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) setOpen(true);
        else setActive((a) => (a + 1) % normalizedOptions.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) setOpen(true);
        else
          setActive(
            (a) => (a - 1 + normalizedOptions.length) % normalizedOptions.length,
          );
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) choose(active);
        else setOpen(true);
        break;
      case "Escape":
        if (open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case "Home":
        if (open) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          event.preventDefault();
          setActive(options.length - 1);
        }
        break;
    }
  };

  return (
    <div className={`form-field${className ? ` ${className}` : ""}`}>
      <label id={labelId}>{label}</label>
      <div
        className={`select${open ? " is-open" : ""}`}
        ref={rootRef}
        onKeyDown={onKeyDown}
      >
        <button
          type="button"
          className="select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          ref={triggerRef}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="select-value">{selected.label}</span>
        </button>
        <ul
          className="select-menu"
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={-1}
        >
          {normalizedOptions.map((opt, i) => (
            <li
              key={opt.value || opt.label}
              className={`select-option${i === active ? " is-active" : ""}`}
              role="option"
              aria-selected={opt.value === selected.value}
              onClick={() => choose(i)}
              onMouseMove={() => setActive(i)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
        <input type="hidden" name={name} value={selected.value} readOnly />
      </div>
    </div>
  );
}

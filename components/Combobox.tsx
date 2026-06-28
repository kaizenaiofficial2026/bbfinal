"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type ComboboxOption = {
  /** The value committed to the hidden input and posted with the form. */
  value: string;
  /** The text shown in the list and in the input once selected. */
  label: string;
  /** Optional muted second line under the label (e.g. an airport name). */
  sublabel?: string;
  /** ISO-2 country code; when set, the matching /flags/<code>.svg is shown. */
  iconCode?: string;
  /** Extra text folded into search matching (e.g. a country code). */
  keywords?: string;
};

type ComboboxProps = {
  /** Name of the hidden input that carries the committed value. */
  name: string;
  label: string;
  placeholder?: string;
  /** Committed value to start from / repopulate after a failed submit. */
  defaultValue?: string;
  /** Display text for defaultValue when it isn't in `options` (free-text echo). */
  defaultLabel?: string;
  /** Static option list (country). Mutually exclusive with loadOptions. */
  options?: ComboboxOption[];
  /** Async source (city). Called debounced as the user types. */
  loadOptions?: (query: string, signal: AbortSignal) => Promise<ComboboxOption[]>;
  /** Commit whatever the user typed even if it isn't in the list (city). */
  allowCustom?: boolean;
  disabled?: boolean;
  /** Placeholder shown while disabled (e.g. "Select a country first"). */
  disabledHint?: string;
  error?: string;
  emptyText?: string;
  loadingText?: string;
  required?: boolean;
  onChange?: (value: string, option?: ComboboxOption) => void;
};

const MAX_VISIBLE = 60;
const DEBOUNCE_MS = 220;

function normalize(s: string) {
  return s.trim().toLowerCase();
}

// Rank: case-insensitive prefix matches first, then substring matches.
function filterStatic(options: ComboboxOption[], query: string): ComboboxOption[] {
  const q = normalize(query);
  if (!q) return options.slice(0, MAX_VISIBLE);
  const scored: { opt: ComboboxOption; score: number }[] = [];
  for (const opt of options) {
    const hay = `${opt.label} ${opt.value} ${opt.keywords ?? ""}`.toLowerCase();
    const idx = hay.indexOf(q);
    if (idx < 0) continue;
    const prefix = opt.label.toLowerCase().startsWith(q);
    scored.push({ opt, score: prefix ? 0 : idx + 1 });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, MAX_VISIBLE).map((s) => s.opt);
}

export default function Combobox({
  name,
  label,
  placeholder,
  defaultValue,
  defaultLabel,
  options,
  loadOptions,
  allowCustom = false,
  disabled = false,
  disabledHint,
  error,
  emptyText = "No matches",
  loadingText = "Searching…",
  required = false,
  onChange,
}: ComboboxProps) {
  const isAsync = typeof loadOptions === "function";
  const labelId = useId();
  const listId = useId();
  const statusId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve the initial display label for the committed value.
  const initialLabel = useMemo(() => {
    if (!defaultValue) return "";
    const match = options?.find((o) => o.value === defaultValue);
    return match?.label ?? defaultLabel ?? defaultValue;
  }, [defaultValue, defaultLabel, options]);

  const [value, setValue] = useState(defaultValue ?? "");
  const [query, setQuery] = useState(initialLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [asyncList, setAsyncList] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  // Whether the current async query has resolved at least once — lets us tell
  // "still loading" apart from "loaded and empty" for the status message.
  const [fetched, setFetched] = useState(false);
  // Whether the user has edited the input since the last commit/open. We only
  // filter/search once they actually type, so opening shows the full picker.
  const [typed, setTyped] = useState(false);

  // Re-sync when the parent supplies a new defaultValue (e.g. a server action
  // echoing values back after a failed submit). Uses the supported
  // "adjust state during render when a prop changes" pattern.
  const [lastDefault, setLastDefault] = useState(defaultValue);
  if (defaultValue !== lastDefault) {
    setLastDefault(defaultValue);
    setValue(defaultValue ?? "");
    setQuery(initialLabel);
  }

  const visible = useMemo(() => {
    if (isAsync) return asyncList;
    if (!options) return [];
    // Before the user types, show the full (capped) list, not a filtered one.
    return filterStatic(options, typed ? query : "");
  }, [isAsync, asyncList, options, query, typed]);

  // Debounced async fetch (city). Runs whenever the menu is open: on open (no
  // typed query) it loads the country's top cities; as the user types it
  // filters. All state writes happen in async callbacks, never synchronously in
  // the effect body, to satisfy the compiler lint rules.
  useEffect(() => {
    if (!isAsync || !loadOptions || !open) return;
    const q = typed ? query.trim() : "";
    const controller = new AbortController();
    const handle = setTimeout(
      () => {
        setLoading(true);
        loadOptions(q, controller.signal)
          .then((opts) => {
            if (controller.signal.aborted) return;
            setAsyncList(opts);
            setActive(0);
            setLoading(false);
            setFetched(true);
          })
          .catch(() => {
            if (controller.signal.aborted) return;
            setAsyncList([]);
            setLoading(false);
            setFetched(true);
          });
      },
      typed ? DEBOUNCE_MS : 0,
    );
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [isAsync, loadOptions, query, open, typed]);

  const commit = (opt: ComboboxOption) => {
    setValue(opt.value);
    setQuery(opt.label);
    setTyped(false);
    setOpen(false);
    onChange?.(opt.value, opt);
    inputRef.current?.blur();
  };

  // When focus leaves: keep free text (city) or fall back to the last valid
  // selection (country) so the field never holds an unmatched value.
  const closeAndSettle = () => {
    setOpen(false);
    setTyped(false);
    if (allowCustom) {
      const text = query.trim();
      // Live-synced already, but normalise trailing whitespace on close.
      if (text !== value) {
        setValue(text);
        onChange?.(text, text ? { value: text, label: text } : undefined);
      }
    } else {
      // Restore the display label of the committed value.
      const match = options?.find((o) => o.value === value);
      setQuery(match?.label ?? (value ? defaultLabel ?? value : ""));
    }
  };

  // Keep the document-level "settle" handler pointing at the latest closure
  // without re-subscribing on every render or hand-maintaining a dep list.
  const settleRef = useRef(closeAndSettle);
  useEffect(() => {
    settleRef.current = closeAndSettle;
  });

  // Close on outside click.
  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) settleRef.current();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Keep the keyboard-highlighted option scrolled into the menu viewport.
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`${listId}-${active}`);
    // Guard for environments (jsdom) where scrollIntoView throws.
    try {
      el?.scrollIntoView({ block: "nearest" });
    } catch {
      /* no-op */
    }
  }, [active, open, listId]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) {
          setOpen(true);
        } else if (visible.length) {
          setActive((a) => (a + 1) % visible.length);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (open && visible.length) {
          setActive((a) => (a - 1 + visible.length) % visible.length);
        }
        break;
      case "Enter":
        // Only swallow Enter when we actually handle it here; otherwise let it
        // bubble so the surrounding form can submit (matches plain inputs).
        if (open && visible[active]) {
          event.preventDefault();
          commit(visible[active]);
        } else if (open && allowCustom && query.trim()) {
          event.preventDefault();
          closeAndSettle();
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          closeAndSettle();
        }
        break;
      case "Tab":
        closeAndSettle();
        break;
    }
  };

  const showFlag = (code?: string) =>
    code ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="combobox-flag"
        src={`/flags/${code.toLowerCase()}.svg`}
        alt=""
        aria-hidden="true"
        width={22}
        height={16}
        loading="lazy"
      />
    ) : null;

  const selectedOption = !isAsync
    ? options?.find((o) => o.value === value)
    : undefined;

  const emptyMessage = isAsync && !fetched ? loadingText : emptyText;
  const statusMessage = loading
    ? loadingText
    : visible.length === 0
      ? emptyMessage
      : "";

  return (
    <div
      className={`combobox-field${error ? " is-invalid" : ""}`}
      ref={rootRef}
    >
      <label id={labelId} htmlFor={`cb-${name}`}>
        {label}
      </label>
      <div className={`combobox${open ? " is-open" : ""}`}>
        <span className="combobox-control">
          {!typed && showFlag(selectedOption?.iconCode)}
          <input
            id={`cb-${name}`}
            ref={inputRef}
            type="text"
            role="combobox"
            className="combobox-input"
            autoComplete="off"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-labelledby={labelId}
            aria-activedescendant={
              open && !loading && visible[active]
                ? `${listId}-${active}`
                : undefined
            }
            disabled={disabled}
            required={required}
            placeholder={disabled ? disabledHint : placeholder}
            value={query}
            onFocus={() => {
              setOpen(true);
              if (isAsync) {
                // Reopen: drop stale results and re-query the full list.
                setFetched(false);
                setAsyncList([]);
              }
            }}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              setTyped(true);
              setOpen(true);
              setActive(0);
              // Free-text fields post exactly what's typed, so a value typed and
              // submitted (e.g. Enter from another field) is never dropped, and
              // the parent stays in sync live (no blur needed).
              if (allowCustom) {
                setValue(v.trim());
                onChange?.(v.trim());
              }
              if (isAsync) setFetched(false);
            }}
            onKeyDown={onKeyDown}
          />
          <span className="combobox-caret" aria-hidden="true" />
        </span>

        {open && !disabled ? (
          <ul
            className="combobox-menu"
            role="listbox"
            id={listId}
            aria-labelledby={labelId}
            data-lenis-prevent
          >
            {visible.length === 0 ? (
              <li className="combobox-status" role="presentation">
                {statusMessage}
              </li>
            ) : (
              visible.map((opt, i) => (
                <li
                  key={opt.value || opt.label}
                  id={`${listId}-${i}`}
                  className={`combobox-option${i === active ? " is-active" : ""}`}
                  role="option"
                  aria-selected={opt.value === value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(opt);
                  }}
                  onMouseMove={() => setActive(i)}
                >
                  {showFlag(opt.iconCode)}
                  <span className="combobox-option-text">
                    <span className="combobox-option-label">{opt.label}</span>
                    {opt.sublabel ? (
                      <span className="combobox-option-sub">{opt.sublabel}</span>
                    ) : null}
                  </span>
                </li>
              ))
            )}
          </ul>
        ) : null}

        <input type="hidden" name={name} value={value} />
      </div>

      {/* Screen-reader status: announces search progress / result emptiness. */}
      <div id={statusId} className="visually-hidden" role="status" aria-live="polite">
        {open ? statusMessage : ""}
      </div>

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

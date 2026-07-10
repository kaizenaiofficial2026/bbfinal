"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { value: string; label: string };

/**
 * Admin status dropdown built on shadcn/Radix Select but skinned (via the
 * unlayered `.admin-select-trigger` rule in globals.css) to match the native
 * `.admin-form select` it replaces. Radix renders a hidden native select for
 * `name`, so it still submits with the enclosing form's server action.
 */
export function AdminSelect({
  name,
  defaultValue,
  options,
  ariaLabel,
}: {
  name: string;
  defaultValue?: string;
  options: Option[];
  ariaLabel?: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger className="admin-select-trigger" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

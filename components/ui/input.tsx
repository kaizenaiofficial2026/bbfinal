import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Input primitive (shadcn). Two variants so one component serves both looks:
 * - `field` (default): Beyond Borders' auth field style (see `.auth-field input`
 *   in globals.css) — 48px tall, 10px radius, hairline border, gold focus ring.
 *   Used by the public/account forms and `PasswordInput`.
 * - `bare`: no baked utilities. Appearance comes entirely from the bespoke
 *   `.admin-form input` / `.admin-login-card input` rules in globals.css, which
 *   are unlayered and drive the admin field look verbatim (13px/700 inherited
 *   font, 5px radius). This keeps the admin panel pixel-identical after the swap.
 */
const inputVariants = cva("", {
  variants: {
    variant: {
      field:
        "w-full min-h-12 rounded-[10px] border border-line bg-paper px-3.5 py-3 text-[15px] text-ink outline-none transition-[color,border-color,box-shadow] duration-150 placeholder:text-muted focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/15 disabled:bg-ivory disabled:text-ink-soft",
      bare: "",
    },
  },
  defaultVariants: { variant: "field" },
})

function Input({
  className,
  variant,
  type,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }

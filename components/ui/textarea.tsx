import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Textarea primitive (shadcn). Mirrors `Input`'s two-variant approach:
 * - `field` (default): the public field look (hairline border, gold focus ring).
 * - `bare`: no baked utilities — the admin forms style textareas via the
 *   unlayered `.admin-form textarea` rule (5px radius, 130px min-height), so the
 *   swap is visually identical.
 */
const textareaVariants = cva("", {
  variants: {
    variant: {
      field:
        "w-full min-h-24 rounded-[10px] border border-line bg-paper px-3.5 py-3 text-[15px] text-ink outline-none transition-[color,border-color,box-shadow] duration-150 placeholder:text-muted focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/15 disabled:bg-ivory disabled:text-ink-soft",
      bare: "",
    },
  },
  defaultVariants: { variant: "field" },
})

function Textarea({
  className,
  variant,
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Button primitive (shadcn/Radix) re-skinned to Beyond Borders' existing button
 * system. Variants map 1:1 to the hand-written `.btn` classes in globals.css so
 * markup and appearance stay identical to the pre-shadcn site — we adopt the
 * component's structure (Slot/asChild, data-slot, cn merging) without restyling.
 *
 * There is intentionally NO default variant and an empty base: when a caller
 * passes a full className string (as the legacy call sites do), it flows through
 * verbatim. New code can use `variant="primary" | "line" | ...` instead.
 */
const buttonVariants = cva("", {
  variants: {
    variant: {
      primary: "btn btn-primary",
      line: "btn btn-line",
      secondary: "btn btn-secondary",
      light: "btn btn-light",
      danger: "btn btn-danger",
    },
  },
})

function Button({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      {...(variant ? { "data-variant": variant } : {})}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }

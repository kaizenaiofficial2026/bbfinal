"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Label primitive (shadcn/Radix). Two variants:
 * - `default`: shadcn's inline label style (flex row, small medium text).
 * - `bare`: no baked utilities — the admin panel wraps its field caption + input
 *   in a `<label>` styled by the unlayered `.admin-form label` rule (grid, 7px
 *   gap, 13px/700). Using `bare` keeps that look and the native htmlFor/click
 *   association Radix provides.
 */
const labelVariants = cva("", {
  variants: {
    variant: {
      default:
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
      bare: "",
    },
  },
  defaultVariants: { variant: "default" },
})

function Label({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(labelVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Label, labelVariants }

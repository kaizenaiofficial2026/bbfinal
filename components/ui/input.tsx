import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input primitive re-skinned to Beyond Borders' field style (see `.auth-field
 * input` in globals.css): 48px tall, 10px radius, hairline border, gold focus
 * ring. Kept token-driven so it matches the site in light and any locale.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-h-12 rounded-[10px] border border-line bg-paper px-3.5 py-3 text-[15px] text-ink outline-none transition-[color,border-color,box-shadow] duration-150 placeholder:text-muted focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/15 disabled:bg-ivory disabled:text-ink-soft",
        className
      )}
      {...props}
    />
  )
}

export { Input }

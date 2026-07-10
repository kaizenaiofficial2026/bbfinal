import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Badge primitive (shadcn). An empty-base pill that renders a `<span>` (or the
 * child element via `asChild`) with `data-slot="badge"` and forwards
 * `className`. The admin `StatusBadge` composes it with the unlayered
 * `.admin-badge admin-badge--{tone}` classes so the status pills look identical.
 */
function Badge({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return <Comp data-slot="badge" className={cn(className)} {...props} />
}

export { Badge }

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card primitive (shadcn). An empty-base container that renders a `<div>` with
 * `data-slot="card"` and forwards `className`, so bespoke styling drives the
 * look. The admin panel passes `admin-card` (see globals.css) to keep the
 * existing panel/card appearance verbatim; new code can style it with utilities.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn(className)} {...props} />
}

export { Card }

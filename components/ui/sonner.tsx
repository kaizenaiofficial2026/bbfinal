"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Sonner toaster configured to reproduce Beyond Borders' existing toast look:
 * top-center, light, expanded stack, and `unstyled` so the app's own `.toast`
 * markup + CSS (rendered via toast.custom in components/Toast.tsx) fully controls
 * each toast's appearance. Geometry mirrors the old `.toast-container` (fixed
 * 92px from top / 78px on mobile, 12px gap, min(420px, 100vw-32px) wide).
 */
const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      expand
      gap={12}
      offset={92}
      mobileOffset={78}
      toastOptions={{ unstyled: true }}
      style={{ "--width": "min(420px, calc(100vw - 32px))" } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }

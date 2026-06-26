"use client";

import { useEffect } from "react";
import { useToast } from "@/components/Toast";

/**
 * Surfaces an auth-page `?error=` message (e.g. a rate-limit notice) as a toast
 * popup, on top of the inline alert. Renders nothing itself. The toast store is
 * an external system, so the call lives in an effect (no setState here).
 */
export default function AuthErrorToast({ error }: { error?: string }) {
  const toast = useToast();
  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);
  return null;
}

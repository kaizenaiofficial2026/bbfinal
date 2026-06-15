import "server-only";

import { Resend } from "resend";
import { env } from "@/lib/env";

export function getResendClient() {
  if (!env.resendApiKey) {
    return null;
  }

  return new Resend(env.resendApiKey);
}

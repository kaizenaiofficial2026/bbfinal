import "server-only";

import { env } from "@/lib/env";
import { generateToken } from "@/lib/security/request";

export function createPayToken() {
  return generateToken(32);
}

export function createPayTokenExpiry() {
  return new Date(Date.now() + env.payLinkTtlHours * 60 * 60 * 1000).toISOString();
}

export function createMpgsOrderId(reference: string) {
  return `${reference}-${Date.now()}`;
}

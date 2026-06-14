const bool = (value: string | undefined) => value === "true";

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  adminAllowedEmails: (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom:
    process.env.EMAIL_FROM ?? "Beyond Borders <bookings@beyondborders.lk>",
  emailTeamInbox: process.env.EMAIL_TEAM_INBOX ?? "bookings@beyondborders.lk",
  paymentsEnabled: bool(process.env.PAYMENTS_ENABLED),
  mpgsBaseUrl:
    process.env.MPGS_BASE_URL ??
    "https://test-seylan.mtf.gateway.mastercard.com",
  mpgsApiVersion: process.env.MPGS_API_VERSION ?? "100",
  mpgsMerchantId: process.env.MPGS_MERCHANT_ID,
  mpgsApiPassword: process.env.MPGS_API_PASSWORD,
  mpgsMerchantName: process.env.MPGS_MERCHANT_NAME ?? "Beyond Borders",
  mpgsCurrency: process.env.MPGS_CURRENCY ?? "LKR",
  mpgsWebhookSecret: process.env.MPGS_WEBHOOK_SECRET,
  payLinkTtlHours: Number(process.env.PAY_LINK_TTL_HOURS ?? 72),
};

export function hasSupabasePublicEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasSupabaseServiceEnv() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

export function requireServerEnv(name: keyof typeof env) {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return String(value);
}

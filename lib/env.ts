import "server-only";

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
  smtpHost: process.env.SMTP_HOST ?? "smtp.zoho.com",
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  emailFrom:
    process.env.EMAIL_FROM ?? "Beyond Borders <reservations@beyondborders.lk>",
  emailTeamInbox:
    process.env.EMAIL_TEAM_INBOX ?? "reservations@beyondborders.lk",
  paymentsEnabled: bool(process.env.PAYMENTS_ENABLED),
  mpgsBaseUrl:
    process.env.MPGS_BASE_URL ??
    "https://test-seylan.mtf.gateway.mastercard.com",
  mpgsApiVersion: process.env.MPGS_API_VERSION ?? "100",
  mpgsMerchantId: process.env.MPGS_MERCHANT_ID,
  mpgsApiPassword: process.env.MPGS_API_PASSWORD,
  mpgsMerchantName: process.env.MPGS_MERCHANT_NAME ?? "Beyond Borders",
  // The Seylan MPGS merchant settles in USD, so prices are charged in USD with
  // no conversion. Used as the default currency for new packages.
  mpgsCurrency: process.env.MPGS_CURRENCY ?? "USD",
  // Legacy USD→LKR rate, kept for the convertCharge fallback util; unused while
  // the gateway settles in USD.
  usdToLkrRate: Number(process.env.USD_TO_LKR_RATE ?? 300),
  mpgsWebhookSecret: process.env.MPGS_WEBHOOK_SECRET,
  payLinkTtlHours: Number(process.env.PAY_LINK_TTL_HOURS ?? 72),
  // SMS notifications (smslenz.lk). Off by default; enable only once creds + the
  // business mobile are configured. sender_id ("SMS Nick Name") must be an
  // smslenz-approved sender — use "SMSlenzDEMO" for testing, "BB Tours SL" in prod.
  smsEnabled: bool(process.env.SMS_ENABLED),
  smsBaseUrl: process.env.SMS_BASE_URL ?? "https://smslenz.lk/api/send-sms",
  smsUserId: process.env.SMS_USER_ID,
  smsApiKey: process.env.SMS_API_KEY,
  smsSenderId: process.env.SMS_SENDER_ID ?? "SMSlenzDEMO",
  smsTeamContact: process.env.SMS_TEAM_CONTACT,
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

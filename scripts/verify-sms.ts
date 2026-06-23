import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const baseUrl = process.env.SMS_BASE_URL ?? "https://smslenz.lk/api/send-sms";
const userId = process.env.SMS_USER_ID;
const apiKey = process.env.SMS_API_KEY;
const senderId = process.env.SMS_SENDER_ID ?? "SMSlenzDEMO";
const contact = process.env.SMS_TEAM_CONTACT;

if (!userId || !apiKey || !contact) {
  throw new Error(
    "SMS_USER_ID, SMS_API_KEY and SMS_TEAM_CONTACT must be set in .env to verify SMS.",
  );
}

const message = [
  "Dear BEYOND BORDERS,",
  'Transaction Order Number "BB-INQ-TEST01".',
  "You have received a customer inquiry.",
  "Date (smslenz test message)",
].join("\n");

const payload = {
  user_id: userId,
  api_key: apiKey,
  sender_id: senderId,
  contact,
  message,
};

async function main() {
  console.log(`Sending test SMS via ${baseUrl}`);
  console.log(`  sender_id: ${senderId}`);
  console.log(`  contact:   ${contact}`);

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "manual", // a 302 here means smslenz rejected the request (bad creds)
  });

  const body = await response.text();
  console.log(`HTTP ${response.status} ${response.statusText}`);
  console.log("Response body:");
  console.log(body.slice(0, 800));

  if (response.status >= 300 && response.status < 400) {
    console.error(
      "\n❌ Redirect (3xx) — smslenz rejected the request, usually invalid SMS_USER_ID / SMS_API_KEY. Double-check the credentials from your smslenz settings page.",
    );
    process.exit(1);
  }

  if (!response.ok) {
    console.error(
      "\n❌ Non-2xx response. If the body indicates a format error, the gateway may expect form-urlencoded — switch lib/sms/client.ts to URLSearchParams.",
    );
    process.exit(1);
  }

  console.log("\n✅ Request accepted. Check the recipient handset for delivery.");
}

main().catch((error) => {
  console.error("❌ SMS verify failed:");
  console.error(error);
  process.exit(1);
});

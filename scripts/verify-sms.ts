import { createHash } from "node:crypto";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// Manual, live end-to-end check for the Dialog RichCommunication gateway. This
// sends ONE real SMS to SMS_TEAM_CONTACT, so run it deliberately (it bills).
const baseUrl =
  process.env.SMS_BASE_URL ?? "https://richcommunication.dialog.lk/api/sms/send";
const username = process.env.SMS_USERNAME;
const password = process.env.SMS_PASSWORD;
const mask = process.env.SMS_MASK;
const contact = process.env.SMS_TEAM_CONTACT;

if (!username || !password || !mask || !contact) {
  throw new Error(
    "SMS_USERNAME, SMS_PASSWORD, SMS_MASK and SMS_TEAM_CONTACT must be set in .env to verify SMS.",
  );
}

function normalizeMsisdn(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return `94${digits}`;
}

const number = normalizeMsisdn(contact);
const message = [
  "Dear BEYOND BORDERS,",
  'Transaction Order Number "BB-INQ-TEST01".',
  "You have received a customer inquiry.",
  "Date (Dialog test message)",
].join("\n");

const digest = createHash("md5").update(password).digest("hex");
const created = new Date().toISOString().replace(/\.\d+Z$/, "");

const body = {
  messages: [{ clientRef: Date.now(), number, mask, text: message }],
};

async function main() {
  console.log(`Sending test SMS via ${baseUrl}`);
  console.log(`  mask:   ${mask}`);
  console.log(`  number: ${number}`);

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      USER: username as string,
      DIGEST: digest,
      CREATED: created,
    },
    body: JSON.stringify(body),
    redirect: "manual",
  });

  const raw = await response.text();
  console.log(`HTTP ${response.status} ${response.statusText}`);
  console.log("Response body:");
  console.log(raw.slice(0, 800));

  if (!response.ok) {
    console.error(
      "\n❌ Non-2xx response — check SMS_BASE_URL and that the account is active.",
    );
    process.exit(1);
  }

  let resultCode: unknown;
  try {
    resultCode = (JSON.parse(raw) as { resultCode?: unknown }).resultCode;
  } catch {
    resultCode = undefined;
  }

  if (resultCode !== 0) {
    console.error(
      `\n❌ Gateway rejected the send (resultCode=${String(resultCode)}). Common causes: wrong SMS_USERNAME/SMS_PASSWORD, or the mask "${mask}" is not registered/approved for this account.`,
    );
    process.exit(1);
  }

  console.log("\n✅ Accepted (resultCode 0). Check the recipient handset for delivery.");
}

main().catch((error) => {
  console.error("❌ SMS verify failed:");
  console.error(error);
  process.exit(1);
});

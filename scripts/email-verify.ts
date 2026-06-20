import { loadEnvConfig } from "@next/env";
import nodemailer from "nodemailer";

loadEnvConfig(process.cwd());

const host = process.env.SMTP_HOST ?? "smtp.zoho.com";
const port = Number(process.env.SMTP_PORT ?? 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;
const from = process.env.EMAIL_FROM ?? user;
const to = process.env.SMTP_USER; // self-send so the test lands in your own mailbox

if (!user || !pass) {
  throw new Error("SMTP_USER and SMTP_PASSWORD must be set in .env to verify email.");
}

async function main() {
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: user!, pass: pass! },
  });

  console.log(`Verifying SMTP login to ${host}:${port} as ${user} ...`);
  await transport.verify();
  console.log("✅ SMTP connection + auth OK");

  console.log(`Sending test email from "${from}" to ${to} ...`);
  const info = await transport.sendMail({
    from,
    to: to!,
    subject: "Beyond Borders — SMTP test ✅",
    text: "If you can read this, Zoho SMTP is wired up correctly.",
    html: "<p>If you can read this, <strong>Zoho SMTP is wired up correctly.</strong></p>",
  });
  console.log(`✅ Sent. messageId: ${info.messageId}`);
}

main().catch((error) => {
  console.error("❌ Email verify failed:");
  console.error(error);
  process.exit(1);
});

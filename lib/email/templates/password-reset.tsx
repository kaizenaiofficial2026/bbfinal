import { Button, Text } from "@react-email/components";
import { detail, EmailShell, paragraph } from "./shared";

export function PasswordResetCode({
  accountEmail,
  code,
  resetUrl,
  ttlMinutes,
}: {
  accountEmail?: string;
  code: string;
  resetUrl: string;
  ttlMinutes: number;
}) {
  return (
    <EmailShell
      preview="Your Beyond Borders password reset code"
      title="Reset your password"
    >
      <Text style={paragraph}>
        We received a request to reset your Beyond Borders password. Enter the
        code below to set a new one. It expires in {ttlMinutes} minutes.
      </Text>
      {accountEmail ? (
        <Text style={paragraph}>This code is for {accountEmail}.</Text>
      ) : null}
      <Text style={codeBox}>{code}</Text>
      <Text style={paragraph}>
        Open the reset page and enter this code:
      </Text>
      <Button href={resetUrl} style={button}>
        Reset password
      </Button>
      <Text style={paragraph}>
        If you didn&apos;t request this, you can safely ignore this email — your
        password won&apos;t change.
      </Text>
    </EmailShell>
  );
}

const codeBox = {
  ...detail,
  fontSize: "30px",
  fontWeight: "700",
  letterSpacing: "8px",
  textAlign: "center" as const,
  fontFamily: "monospace",
};

const button = {
  backgroundColor: "#1c1a15",
  borderRadius: "5px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "13px",
  fontWeight: "700",
  margin: "4px 0 16px",
  padding: "12px 18px",
  textDecoration: "none",
};

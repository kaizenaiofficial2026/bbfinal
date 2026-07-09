import { Button, Text } from "@react-email/components";
import { env } from "@/lib/env";
import { detail, EmailShell, paragraph } from "./shared";

export function RegistrationReceived({ fullName }: { fullName: string }) {
  return (
    <EmailShell
      preview="Your Beyond Borders account is being reviewed"
      title="Welcome to Beyond Borders"
    >
      <Text style={paragraph}>
        Hi {fullName}, thanks for registering. Our team is reviewing your account
        and you&apos;ll receive a confirmation email once it&apos;s approved.
      </Text>
      <Text style={paragraph}>
        After approval you can reserve any of our journeys and pay securely
        online.
      </Text>
    </EmailShell>
  );
}

export function NewCustomerStaffNotification({
  fullName,
  email,
  phone,
}: {
  fullName: string;
  email: string;
  phone?: string | null;
}) {
  return (
    <EmailShell
      preview="A new customer is awaiting verification"
      title="New customer to verify"
    >
      <Text style={paragraph}>
        {fullName} just registered and is awaiting verification.
      </Text>
      <Text style={detail}>
        Name: {fullName}
        <br />
        Email: {email}
        <br />
        Phone: {phone || "Not provided"}
      </Text>
      <Button href={`${env.siteUrl}/admin/users`} style={button}>
        Review in admin
      </Button>
    </EmailShell>
  );
}

export function AccountVerified({ fullName }: { fullName: string }) {
  return (
    <EmailShell
      preview="Your Beyond Borders account is verified"
      title="Your account is verified"
    >
      <Text style={paragraph}>
        Hi {fullName}, your account has been approved. You can now reserve a
        journey and complete payment securely online.
      </Text>
      <Button href={`${env.siteUrl}/tours`} style={button}>
        Browse journeys
      </Button>
    </EmailShell>
  );
}

export function InvoiceEmail({
  travellerName,
  reference,
  amount,
  currency,
  items,
  transactionId,
  paidAt,
}: {
  travellerName: string;
  reference: string;
  amount: number;
  currency: string;
  items: { title: string; amount: number; currency: string }[];
  transactionId?: string | null;
  paidAt?: string;
}) {
  const journeys = items.length > 0 ? items : [{ title: "Beyond Borders journey", amount, currency }];
  const multiple = journeys.length > 1;
  return (
    <EmailShell
      preview={`Invoice for order ${reference}`}
      title="Payment received — your invoice"
    >
      <Text style={paragraph}>
        Hi {travellerName}, thank you. We&apos;ve received your payment for order{" "}
        {reference}. Your invoice is below.
      </Text>
      <Text style={detail}>
        Order: {reference}
        <br />
        {multiple ? "Journeys:" : "Journey:"}
        <br />
        {journeys.map((item, index) => (
          <span key={index}>
            &nbsp;&nbsp;• {item.title} — {item.currency} {item.amount.toFixed(2)}
            <br />
          </span>
        ))}
        Total paid: {currency} {amount.toFixed(2)}
        <br />
        {transactionId ? (
          <>
            Transaction: {transactionId}
            <br />
          </>
        ) : null}
        Date: {paidAt ?? new Date().toLocaleDateString("en-GB")}
        <br />
        Status: Paid
      </Text>
      <Text style={paragraph}>
        Our team will be in touch with the next steps for your journey.
      </Text>
    </EmailShell>
  );
}

const button = {
  backgroundColor: "#1c1a15",
  borderRadius: "5px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "13px",
  fontWeight: "700",
  padding: "12px 18px",
  textDecoration: "none",
};

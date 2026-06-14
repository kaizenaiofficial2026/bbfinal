import { Button, Text } from "@react-email/components";
import { env } from "@/lib/env";
import { detail, EmailShell, paragraph } from "./shared";

type BookingEmailProps = {
  reference: string;
  travellerName: string;
  email: string;
  phone?: string | null;
  packageTitle: string;
  travelDates: string;
  travellers: number;
  notes?: string | null;
};

export function BookingStaffNotification(props: BookingEmailProps) {
  return (
    <EmailShell preview="New Beyond Borders booking request" title="New booking request">
      <Text style={paragraph}>
        {props.travellerName} submitted booking request {props.reference}.
      </Text>
      <Text style={detail}>
        Package: {props.packageTitle}
        <br />
        Dates: {props.travelDates}
        <br />
        Travellers: {props.travellers}
        <br />
        Email: {props.email}
        <br />
        Phone: {props.phone || "Not provided"}
        <br />
        Notes: {props.notes || "None"}
      </Text>
    </EmailShell>
  );
}

export function BookingAck(props: Pick<BookingEmailProps, "reference" | "travellerName" | "packageTitle">) {
  return (
    <EmailShell
      preview={`Booking request ${props.reference} received`}
      title="Booking request received"
    >
      <Text style={paragraph}>
        Hi {props.travellerName}, your request for {props.packageTitle} is now
        with our team. Your reference is {props.reference}.
      </Text>
      <Text style={paragraph}>
        We will confirm availability, final pricing and the secure payment link
        after planner review.
      </Text>
    </EmailShell>
  );
}

export function PayLinkEmail({
  travellerName,
  reference,
  amount,
  currency,
  token,
}: {
  travellerName: string;
  reference: string;
  amount: number;
  currency: string;
  token: string;
}) {
  const href = `${env.siteUrl}/pay/${token}`;

  return (
    <EmailShell preview={`Secure payment link for ${reference}`} title="Secure payment link">
      <Text style={paragraph}>
        Hi {travellerName}, your Beyond Borders quote is ready for booking
        request {reference}.
      </Text>
      <Text style={detail}>
        Amount: {currency} {amount.toFixed(2)}
      </Text>
      <Button href={href} style={button}>
        Pay securely
      </Button>
    </EmailShell>
  );
}

export function PaymentReceiptEmail({
  travellerName,
  reference,
  amount,
  currency,
}: {
  travellerName: string;
  reference: string;
  amount: number;
  currency: string;
}) {
  return (
    <EmailShell preview={`Payment received for ${reference}`} title="Payment received">
      <Text style={paragraph}>
        Hi {travellerName}, we received your payment for booking {reference}.
      </Text>
      <Text style={detail}>
        Paid: {currency} {amount.toFixed(2)}
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

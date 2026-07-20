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

export type InvoiceItem = {
  title: string;
  /** Travellers on the line — the quantity, since packages price per traveller. */
  quantity: number;
  /** Line total (per-traveller price × quantity). */
  amount: number;
  currency: string;
};

export type InvoiceCustomer = {
  country?: string | null;
  phone?: string | null;
  email: string;
  passportNumber?: string | null;
};

/** Grouped to 2dp — "USD 15,996.00" reads far better than "USD 15996.00". */
const money = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Purchase confirmation / invoice. Laid out as a proper order table (Product /
 * Quantity / Price) because an order can now cover several packages, each with
 * its own traveller count — a bulleted list couldn't show quantities or make the
 * subtotal add up on screen.
 */
export function InvoiceEmail({
  travellerName,
  reference,
  amount,
  currency,
  items,
  transactionId,
  paidAt,
  customer,
  paymentMethod = "VISA/MasterCard",
}: {
  travellerName: string;
  reference: string;
  amount: number;
  currency: string;
  items: InvoiceItem[];
  transactionId?: string | null;
  paidAt?: string;
  customer?: InvoiceCustomer;
  paymentMethod?: string;
}) {
  const journeys: InvoiceItem[] =
    items.length > 0
      ? items
      : [{ title: "Beyond Borders journey", quantity: 1, amount, currency }];
  // The gateway charges one currency per order, so the lines share the order's.
  const subtotal = journeys.reduce((sum, item) => sum + item.amount, 0);
  const orderDate =
    paidAt ??
    new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  // Address the customer by first name, as the confirmation is a personal note.
  const firstName = travellerName.trim().split(/\s+/)[0] || travellerName;

  return (
    <EmailShell
      preview={`Order ${reference} — thanks for booking with us`}
      title="Thanks for booking with us"
    >
      <Text style={paragraph}>Hi {firstName},</Text>
      <Text style={paragraph}>We have finished processing your order.</Text>

      <Text style={orderLine}>
        [Order {reference}] ({orderDate})
      </Text>

      <table style={table} cellPadding={0} cellSpacing={0} width="100%">
        <thead>
          <tr>
            <th style={{ ...th, textAlign: "left" }}>Product</th>
            <th style={{ ...th, textAlign: "center" }}>Quantity</th>
            <th style={{ ...th, textAlign: "right" }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {journeys.map((item, index) => (
            <tr key={index}>
              <td style={{ ...td, textAlign: "left" }}>{item.title}</td>
              <td style={{ ...td, textAlign: "center" }}>{item.quantity}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {money(item.amount, item.currency)}
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ ...summaryLabel }} colSpan={2}>
              Subtotal:
            </td>
            <td style={{ ...td, textAlign: "right" }}>
              {money(subtotal, currency)}
            </td>
          </tr>
          <tr>
            <td style={{ ...summaryLabel }} colSpan={2}>
              Payment method:
            </td>
            <td style={{ ...td, textAlign: "right" }}>{paymentMethod}</td>
          </tr>
          <tr>
            <td style={{ ...summaryLabel, ...totalCell }} colSpan={2}>
              Total:
            </td>
            <td style={{ ...td, ...totalCell, textAlign: "right" }}>
              {money(amount, currency)}
            </td>
          </tr>
        </tbody>
      </table>

      {transactionId ? (
        <Text style={metaLine}>
          <strong>Transaction:</strong> {transactionId}
        </Text>
      ) : null}

      {customer?.passportNumber ? (
        <Text style={metaLine}>
          <strong>NIC/Passport No:</strong> {customer.passportNumber}
        </Text>
      ) : null}

      <Text style={sectionHeading}>Billing address</Text>
      <Text style={detail}>
        {travellerName}
        <br />
        {customer?.country ? (
          <>
            {customer.country}
            <br />
          </>
        ) : null}
        {customer?.phone ? (
          <>
            {customer.phone}
            <br />
          </>
        ) : null}
        {customer?.email}
      </Text>

      <Text style={paragraph}>
        Our team will be in touch with the next steps for your journey.
      </Text>
    </EmailShell>
  );
}

const orderLine = {
  color: "#9d7936",
  fontSize: "17px",
  fontWeight: "700",
  margin: "22px 0 12px",
};

const table = {
  borderCollapse: "collapse" as const,
  width: "100%",
};

const th = {
  backgroundColor: "#f7f3ea",
  border: "1px solid #e7dcc6",
  color: "#1c1a15",
  fontSize: "13px",
  fontWeight: "700",
  padding: "10px 12px",
};

const td = {
  border: "1px solid #e7dcc6",
  color: "#3a362d",
  fontSize: "14px",
  padding: "10px 12px",
};

const summaryLabel = {
  ...td,
  color: "#1c1a15",
  fontWeight: "700",
  textAlign: "left" as const,
};

const totalCell = {
  backgroundColor: "#f7f3ea",
  fontWeight: "700",
};

const sectionHeading = {
  color: "#9d7936",
  fontSize: "15px",
  fontWeight: "700",
  margin: "24px 0 8px",
};

const metaLine = {
  color: "#3a362d",
  fontSize: "14px",
  margin: "10px 0 0",
};

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

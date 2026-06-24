import "server-only";

import { render } from "@react-email/render";
import { env } from "@/lib/env";
import { getMailTransport } from "./client";
import {
  AccountVerified,
  InvoiceEmail,
  NewCustomerStaffNotification,
  RegistrationReceived,
} from "./templates/account";
import { EnquiryAck, EnquiryStaffNotification } from "./templates/enquiry";
import {
  CustomInquiryAck,
  CustomInquiryStaffNotification,
  type InquiryLine,
} from "./templates/custom-inquiry";
import { PasswordResetCode } from "./templates/password-reset";

type SendResult = {
  skipped: boolean;
};

async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}): Promise<SendResult> {
  const transport = getMailTransport();

  if (!transport) {
    console.info(`[email skipped] ${subject}`);
    return { skipped: true };
  }

  const [html, text] = await Promise.all([
    render(react),
    render(react, { plainText: true }),
  ]);

  await transport.sendMail({
    from: env.emailFrom,
    to,
    subject,
    html,
    text,
  });

  return { skipped: false };
}

export async function sendEnquiryEmails(input: {
  name: string;
  email: string;
  phone?: string | null;
  packageLabel?: string | null;
  message: string;
}) {
  await Promise.all([
    sendEmail({
      to: env.emailTeamInbox,
      subject: `New enquiry from ${input.name}`,
      react: <EnquiryStaffNotification {...input} />,
    }),
    sendEmail({
      to: input.email,
      subject: "We received your Beyond Borders enquiry",
      react: <EnquiryAck name={input.name} />,
    }),
  ]);
}

/** Custom inquiry (Package/Hotel/Air ticket/Transport): notify staff + ack the customer. */
export async function sendCustomInquiryEmails(input: {
  inquiryType: string;
  firstName: string;
  fullName: string;
  email: string;
  mobile: string;
  countryCity?: string | null;
  passportNumber?: string | null;
  lines: InquiryLine[];
}) {
  // Notify the team inbox AND the SMTP mailbox (reservations@), de-duplicated.
  const staffRecipients = Array.from(
    new Set(
      [env.emailTeamInbox, env.smtpUser].filter(
        (address): address is string => Boolean(address),
      ),
    ),
  );

  await Promise.all([
    sendEmail({
      to: staffRecipients,
      subject: `New ${input.inquiryType} inquiry from ${input.fullName}`,
      react: (
        <CustomInquiryStaffNotification
          inquiryType={input.inquiryType}
          fullName={input.fullName}
          email={input.email}
          mobile={input.mobile}
          countryCity={input.countryCity}
          passportNumber={input.passportNumber}
          lines={input.lines}
        />
      ),
    }),
    sendEmail({
      to: input.email,
      subject: "We received your inquiry",
      react: (
        <CustomInquiryAck
          firstName={input.firstName}
          inquiryType={input.inquiryType}
        />
      ),
    }),
  ]);
}

export async function sendRegistrationEmails(input: {
  fullName: string;
  email: string;
  phone?: string | null;
}) {
  await Promise.all([
    sendEmail({
      to: input.email,
      subject: "Your Beyond Borders account is being reviewed",
      react: <RegistrationReceived fullName={input.fullName} />,
    }),
    sendEmail({
      to: env.emailTeamInbox,
      subject: `New customer to verify: ${input.fullName}`,
      react: (
        <NewCustomerStaffNotification
          fullName={input.fullName}
          email={input.email}
          phone={input.phone}
        />
      ),
    }),
  ]);
}

export async function sendPasswordResetEmail(input: {
  email: string;
  code: string;
  resetUrl: string;
  ttlMinutes: number;
}) {
  await sendEmail({
    to: input.email,
    subject: "Your Beyond Borders password reset code",
    react: (
      <PasswordResetCode
        code={input.code}
        resetUrl={input.resetUrl}
        ttlMinutes={input.ttlMinutes}
      />
    ),
  });
}

export async function sendAccountVerifiedEmail(input: {
  fullName: string;
  email: string;
}) {
  await sendEmail({
    to: input.email,
    subject: "Your Beyond Borders account is verified",
    react: <AccountVerified fullName={input.fullName} />,
  });
}

/** Invoice on successful payment — sent to the customer AND the reservations inbox. */
export async function sendInvoiceEmails(input: {
  travellerName: string;
  email: string;
  reference: string;
  packageTitle: string;
  amount: number;
  currency: string;
  transactionId?: string | null;
}) {
  const invoice = <InvoiceEmail {...input} />;

  await Promise.all([
    sendEmail({
      to: input.email,
      subject: `Invoice for booking ${input.reference}`,
      react: invoice,
    }),
    sendEmail({
      to: env.emailTeamInbox,
      subject: `Payment received — booking ${input.reference}`,
      react: invoice,
    }),
  ]);
}

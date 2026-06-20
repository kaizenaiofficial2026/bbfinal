import "server-only";

import { render } from "@react-email/render";
import { env } from "@/lib/env";
import { getMailTransport } from "./client";
import { BookingAck, BookingStaffNotification, PaymentReceiptEmail, PayLinkEmail } from "./templates/booking";
import { EnquiryAck, EnquiryStaffNotification } from "./templates/enquiry";

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

export async function sendBookingEmails(input: {
  reference: string;
  travellerName: string;
  email: string;
  phone?: string | null;
  packageTitle: string;
  travelDates: string;
  travellers: number;
  notes?: string | null;
}) {
  await Promise.all([
    sendEmail({
      to: env.emailTeamInbox,
      subject: `New booking request ${input.reference}`,
      react: <BookingStaffNotification {...input} />,
    }),
    sendEmail({
      to: input.email,
      subject: `Booking request ${input.reference} received`,
      react: <BookingAck {...input} />,
    }),
  ]);
}

export async function sendPayLinkEmail(input: {
  travellerName: string;
  email: string;
  reference: string;
  amount: number;
  currency: string;
  token: string;
}) {
  await sendEmail({
    to: input.email,
    subject: `Secure payment link for ${input.reference}`,
    react: <PayLinkEmail {...input} />,
  });
}

export async function sendPaymentReceipt(input: {
  travellerName: string;
  email: string;
  reference: string;
  amount: number;
  currency: string;
}) {
  await sendEmail({
    to: input.email,
    subject: `Payment received for ${input.reference}`,
    react: <PaymentReceiptEmail {...input} />,
  });
}

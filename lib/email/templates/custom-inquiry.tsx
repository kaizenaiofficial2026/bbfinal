import { Text } from "@react-email/components";
import { detail, EmailShell, paragraph } from "./shared";

export type InquiryLine = {
  label: string;
  value: string;
  // A section header (e.g. "Hotel") rendered in bold with no value. Used by the
  // combined multi-service inquiry to group its sections.
  heading?: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  package: "Package",
  hotel: "Hotel",
  airticket: "Air ticket",
  transport: "Transport",
};

export function CustomInquiryStaffNotification({
  inquiryType,
  fullName,
  email,
  mobile,
  countryCity,
  passportNumber,
  lines,
}: {
  inquiryType: string;
  fullName: string;
  email: string;
  mobile: string;
  countryCity?: string | null;
  passportNumber?: string | null;
  lines: InquiryLine[];
}) {
  const typeLabel = TYPE_LABELS[inquiryType] ?? inquiryType;

  return (
    <EmailShell
      preview={`New ${typeLabel} inquiry from ${fullName}`}
      title={`New ${typeLabel} inquiry`}
    >
      <Text style={paragraph}>
        {fullName} submitted a {typeLabel.toLowerCase()} inquiry.
      </Text>
      <Text style={detail}>
        {lines.map((line, index) =>
          line.heading ? (
            <span key={index}>
              {index > 0 ? <br /> : null}
              <strong>{line.label}</strong>
              <br />
            </span>
          ) : (
            <span key={index}>
              {line.label}: {line.value}
              <br />
            </span>
          ),
        )}
      </Text>
      <Text style={detail}>
        Name: {fullName}
        <br />
        Email: {email}
        <br />
        Mobile: {mobile}
        <br />
        Country &amp; City: {countryCity || "Not provided"}
        <br />
        Passport: {passportNumber || "Not provided"}
      </Text>
    </EmailShell>
  );
}

export function CustomInquiryAck({
  firstName,
  inquiryType,
}: {
  firstName: string;
  inquiryType: string;
}) {
  const typeLabel = TYPE_LABELS[inquiryType] ?? inquiryType;

  return (
    <EmailShell
      preview="We received your inquiry"
      title="Your inquiry has been received"
    >
      <Text style={paragraph}>
        Hi {firstName}, thank you for your {typeLabel.toLowerCase()} inquiry. Our
        team will review the details and get back to you with a tailored quote.
      </Text>
    </EmailShell>
  );
}

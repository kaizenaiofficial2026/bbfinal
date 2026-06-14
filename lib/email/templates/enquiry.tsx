import { Text } from "@react-email/components";
import { detail, EmailShell, paragraph } from "./shared";

type EnquiryEmailProps = {
  name: string;
  email: string;
  phone?: string | null;
  packageLabel?: string | null;
  message: string;
};

export function EnquiryStaffNotification(props: EnquiryEmailProps) {
  return (
    <EmailShell preview="New Beyond Borders enquiry" title="New enquiry">
      <Text style={paragraph}>
        {props.name} sent a new travel enquiry from the website.
      </Text>
      <Text style={detail}>
        Email: {props.email}
        <br />
        Phone: {props.phone || "Not provided"}
        <br />
        Journey: {props.packageLabel || "Custom / not selected"}
        <br />
        Notes: {props.message}
      </Text>
    </EmailShell>
  );
}

export function EnquiryAck({ name }: Pick<EnquiryEmailProps, "name">) {
  return (
    <EmailShell
      preview="We received your Beyond Borders enquiry"
      title="Your enquiry is with our planners"
    >
      <Text style={paragraph}>
        Hi {name}, thanks for writing to Beyond Borders. A planner will review
        your notes and reply with next steps.
      </Text>
    </EmailShell>
  );
}

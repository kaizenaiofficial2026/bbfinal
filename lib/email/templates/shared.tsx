import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { LOGO_HEIGHT, LOGO_WIDTH, logoSrc } from "../logo";

type EmailShellProps = {
  preview: string;
  title: string;
  children: ReactNode;
};

export function EmailShell({ preview, title, children }: EmailShellProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* The brand mark replaces the old "BEYOND BORDERS" text eyebrow.
              `alt` keeps the brand legible in clients that block images. */}
          <Img
            src={logoSrc()}
            alt="Beyond Borders"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            style={logo}
          />
          <Heading style={heading}>{title}</Heading>
          <Section>{children}</Section>
          <Hr style={rule} />
          <Text style={footer}>
            Private Sri Lanka journeys, planned by Beyond Borders.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const body = {
  backgroundColor: "#f7f3ea",
  color: "#1c1a15",
  fontFamily: "Arial, sans-serif",
};

export const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e7dcc6",
  borderRadius: "8px",
  margin: "32px auto",
  padding: "28px",
  width: "560px",
};

export const logo = {
  display: "block",
  marginBottom: "18px",
};

/** Kept for templates that still set a small caps label above their content. */
export const eyebrow = {
  color: "#9d7936",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "1px",
  textTransform: "uppercase" as const,
};

export const heading = {
  color: "#1c1a15",
  fontSize: "28px",
  lineHeight: "1.2",
};

export const paragraph = {
  color: "#3a362d",
  fontSize: "15px",
  lineHeight: "1.7",
};

export const detail = {
  backgroundColor: "#f7f3ea",
  borderRadius: "8px",
  color: "#1c1a15",
  fontSize: "14px",
  lineHeight: "1.6",
  padding: "16px",
};

export const rule = {
  borderColor: "#e7dcc6",
  margin: "24px 0",
};

export const footer = {
  color: "#8c8475",
  fontSize: "12px",
};

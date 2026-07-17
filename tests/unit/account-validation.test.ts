import { describe, expect, it } from "vitest";
import {
  registerSchema,
  requestResetSchema,
  resetPasswordSchema,
} from "@/lib/validation/account";
import { changePasswordSchema } from "@/lib/validation/admin";

const validRegister = {
  firstName: "Asha",
  lastName: "Perera",
  country: "Sri Lanka",
  city: "Colombo",
  dateOfBirth: "1990-05-01",
  passportNumber: "N1234567",
  passportExpiry: "2032-01-01",
  email: "asha@example.com",
  phone: "+94 77 123 4567",
  password: "supersecret",
  confirmPassword: "supersecret",
};

describe("registerSchema (customer registration)", () => {
  it("accepts a complete, valid registration", () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  it("rejects a mismatched password confirmation", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, confirmPassword: "different" })
        .success,
    ).toBe(false);
  });

  it.each([
    ["firstName", ""],
    ["lastName", ""],
    ["country", ""],
    ["city", ""],
  ])("requires %s", (field, value) => {
    const result = registerSchema.safeParse({ ...validRegister, [field]: value });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, password: "short" }).success,
    ).toBe(false);
  });

  it("rejects a future date of birth", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, dateOfBirth: "2999-01-01" })
        .success,
    ).toBe(false);
  });

  it("rejects an already-expired passport", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, passportExpiry: "2000-01-01" })
        .success,
    ).toBe(false);
  });

  it("rejects a non-alphanumeric passport number", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, passportNumber: "N-12/34" })
        .success,
    ).toBe(false);
  });

  // Regression: the honeypot used to live in this schema as company:max(0), so a
  // browser autofilling it produced "Too big: expected string to have <=0
  // characters" on screen and blocked a real signup. The trap now lives in the
  // action; the schema must ignore any extra field.
  it("ignores the honeypot field, which the action now checks", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, referralCode: "spam" })
        .success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({ ...validRegister, company: "Beyond Borders" })
        .success,
    ).toBe(true);
  });

  // Every message here is rendered to the visitor verbatim, so none of them may
  // be Zod's raw internal wording.
  it("phrases over-length errors for a human", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      firstName: "a".repeat(200),
      city: "b".repeat(200),
      phone: "1".repeat(200),
    });

    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => i.message);
    expect(messages.length).toBeGreaterThan(0);
    for (const message of messages) {
      expect(message).not.toMatch(/too big|too small|expected string/i);
      expect(message).toMatch(/\.$/);
    }
  });
});

describe("password reset schemas", () => {
  it("requestResetSchema accepts a valid email and rejects junk", () => {
    expect(requestResetSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(requestResetSchema.safeParse({ email: "nope" }).success).toBe(false);
  });

  const validReset = {
    email: "a@b.com",
    code: "123456",
    password: "brandnewpass",
    confirm: "brandnewpass",
  };

  it("resetPasswordSchema accepts a valid 6-digit reset", () => {
    expect(resetPasswordSchema.safeParse(validReset).success).toBe(true);
  });

  it("resetPasswordSchema rejects a non-6-digit code", () => {
    expect(
      resetPasswordSchema.safeParse({ ...validReset, code: "12ab" }).success,
    ).toBe(false);
  });

  it("resetPasswordSchema rejects mismatched confirmation", () => {
    expect(
      resetPasswordSchema.safeParse({ ...validReset, confirm: "different" })
        .success,
    ).toBe(false);
  });
});

describe("changePasswordSchema (current + new + OTP)", () => {
  const valid = {
    oldPassword: "currentpw",
    password: "brandnewpass",
    confirm: "brandnewpass",
    code: "654321",
  };

  it("accepts a valid change", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the current password", () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, oldPassword: "" }).success,
    ).toBe(false);
  });

  it("rejects mismatched new passwords", () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, confirm: "nope" }).success,
    ).toBe(false);
  });

  it("rejects a bad OTP code", () => {
    expect(changePasswordSchema.safeParse({ ...valid, code: "1" }).success).toBe(
      false,
    );
  });
});

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
  company: "",
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

  it("rejects a filled honeypot (bot)", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, company: "spam" }).success,
    ).toBe(false);
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

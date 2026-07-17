import { z } from "zod";

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date.");

// Every cap carries its own message: an uncustomised .max() surfaces Zod's raw
// wording ("Too big: expected string to have <=60 characters"), and these
// messages are shown to the visitor verbatim.
export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Please enter your first name.")
    .max(60, "First name is too long."),
  lastName: z
    .string()
    .trim()
    .min(1, "Please enter your last name.")
    .max(60, "Last name is too long."),
  country: z
    .string()
    .trim()
    .min(1, "Please enter your country.")
    .max(80, "Country name is too long."),
  city: z
    .string()
    .trim()
    .min(1, "Please enter your city.")
    .max(80, "City name is too long."),
  dateOfBirth: isoDate.refine((d) => {
    const t = Date.parse(d);
    return !Number.isNaN(t) && t < Date.now();
  }, "Date of birth must be in the past."),
  passportNumber: z
    .string()
    .trim()
    .min(4, "Please enter your passport number.")
    .max(20, "Passport number is too long.")
    .regex(/^[A-Za-z0-9]+$/, "Passport number must be letters and numbers only."),
  passportExpiry: isoDate.refine((d) => {
    const t = Date.parse(d);
    return !Number.isNaN(t) && t > Date.now();
  }, "Passport expiry must be a future date."),
  email: z
    .email("Please enter a valid email address.")
    .max(180, "Email address is too long."),
  phone: z
    .string()
    .trim()
    .min(6, "Please enter your mobile number.")
    .max(40, "Mobile number is too long."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200, "Password must be 200 characters or fewer."),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const requestResetSchema = z.object({
  email: z.email("Please enter a valid email address.").max(180),
});

export const resetPasswordSchema = z
  .object({
    email: z.email("Please enter a valid email address.").max(180),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(200),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Set a password directly (no old password / code) — used by a super admin
// setting a second-level admin's password.
export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(200),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

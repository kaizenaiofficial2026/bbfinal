import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.email("Please enter a valid email address.").max(180),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  // Honeypot: bots fill this hidden field; humans never see it. Must be empty.
  company: z.string().max(0).optional().or(z.literal("")),
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

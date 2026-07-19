import { z } from "zod";

const statusSchema = z.enum(["draft", "published"]);

export const destinationAdminSchema = z.object({
  id: z.uuid().optional().or(z.literal("")),
  slug: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(160),
  tagline: z.string().trim().min(2).max(220),
  keyAttraction: z.string().trim().min(2).max(260),
  summary: z.string().trim().min(10).max(2000),
  bestFor: z.string().trim().min(2).max(220),
  highlights: z.string().trim().min(2),
  heroImage: z.string().trim().optional().or(z.literal("")),
  cardImage: z.string().trim().optional().or(z.literal("")),
  status: statusSchema.default("draft"),
  sortOrder: z.coerce.number().int().default(0),
});

export const packageAdminSchema = z.object({
  id: z.uuid().optional().or(z.literal("")),
  slug: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(160),
  tier: z.string().trim().min(2).max(120),
  hotels: z.string().trim().min(2).max(160),
  destinations: z.string().trim().min(2).max(220),
  duration: z.string().trim().min(2).max(120),
  image: z.string().trim().optional().or(z.literal("")),
  heroImage: z.string().trim().optional().or(z.literal("")),
  summary: z.string().trim().min(10).max(2000),
  inclusions: z.string().trim().min(2),
  itinerary: z.string().trim().min(2),
  priceAmount: z.coerce.number().nonnegative().optional().or(z.literal("")),
  depositAmount: z.coerce.number().nonnegative().optional().or(z.literal("")),
  currency: z.string().trim().min(3).max(3).default("USD"),
  status: statusSchema.default("draft"),
  sortOrder: z.coerce.number().int().default(0),
});

export const enquiryStatusUpdateSchema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "contacted", "closed"]),
});

// Booking status is derived from payment and never set by hand, so there is no
// booking status-update schema (the manual action was removed).

export const settingsSchema = z.object({
  contactEmail: z.email().optional().or(z.literal("")),
  phone: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  heroCopy: z.string().trim().max(500).optional().or(z.literal("")),
});

/**
 * A super admin creating a second-level admin account. The new account's tier is
 * NOT part of this form — it is always second-level, so the panel can never mint
 * another super admin (see lib/admin/auth.ts).
 */
export const createAdminSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter the admin's full name.")
      .max(120, "Full name is too long."),
    email: z
      .email("Enter a valid email address.")
      .max(180, "Email address is too long."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(200, "Password must be 200 characters or fewer."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password."),
    password: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(200),
    confirm: z.string(),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
  })
  .refine((data) => data.password === data.confirm, {
    message: "New passwords do not match.",
    path: ["confirm"],
  });

// Step 1 of the customer/admin wizard: verify current + new password (no code yet).
export const startChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password."),
    password: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(200),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "New passwords do not match.",
    path: ["confirm"],
  });

export function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

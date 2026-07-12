import { z } from "zod";

export const PASSWORD_REQUIREMENT =
  "Use at least 8 characters. Passwords are case-sensitive.";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(254, "Email address must be 254 characters or fewer.")
  .email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(100, "Full name must be 100 characters or fewer.")
  .transform((name) => name.replace(/\s+/g, " "));

const currentPasswordSchema = z
  .string()
  .min(1, "Enter your password.")
  .max(128, "Password must be 128 characters or fewer.");

const newPasswordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.");

function passwordsMatch(schema) {
  return schema.refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
}

export const loginSchema = z.object({
  email: emailSchema,
  password: currentPasswordSchema,
});

export const signupSchema = passwordsMatch(
  z.object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z
      .string()
      .min(1, "Confirm your password.")
      .max(128, "Password must be 128 characters or fewer."),
  }),
);

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = passwordsMatch(
  z.object({
    password: newPasswordSchema,
    confirmPassword: z
      .string()
      .min(1, "Confirm your new password.")
      .max(128, "Password must be 128 characters or fewer."),
  }),
);

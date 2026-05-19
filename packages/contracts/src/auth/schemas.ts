import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "CUSTOMER"]);

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: roleSchema,
  customerId: z.string().optional(),
});

export const loginInputSchema = z.object({
  phone: z.string().min(10).max(20),
  password: z.string().min(8),
});

export const loginOutputSchema = z.object({
  user: sessionUserSchema,
});

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
});

export const meOutputSchema = z.object({
  isAuthenticated: z.boolean(),
  user: sessionUserSchema.optional(),
});

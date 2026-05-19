import { z } from "zod";

export const idInputSchema = z.object({
  id: z.string().min(1),
});

export const customerStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]);
export const serviceGroupStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]);
export const serviceStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]);
export const serverStatusSchema = z.enum(["ACTIVE", "MAINTENANCE", "SUSPENDED", "INACTIVE"]);
export const invoiceStatusSchema = z.enum(["UNPAID", "PAID", "CANCELLED"]);
export const endpointTypeSchema = z.enum(["HTTP", "TCP", "PING", "KEYWORD", "OTHER"]);
export const paymentAttemptStatusSchema = z.enum(["FAILED", "CANCELLED", "EXPIRED", "UNKNOWN"]);
export const serverVisibilityLevelSchema = z.enum(["NONE", "BASIC", "DETAILED"]);

export const moneySchema = z.coerce.number().int().min(0);

export const searchSchema = z.object({
  search: z.string().trim().min(1).max(200).optional(),
});

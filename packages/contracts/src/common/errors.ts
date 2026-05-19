import { z } from "zod";

export const apiErrorCodeSchema = z.enum([
  "AUTH_UNAUTHORIZED",
  "AUTH_FORBIDDEN",
  "AUTH_INVALID_CREDENTIALS",
  "TENANT_ACCESS_DENIED",
  "RESOURCE_NOT_FOUND",
  "VALIDATION_FAILED",
  "INVOICE_LOCKED",
  "INVOICE_INVALID_STATUS",
  "PAYMENT_DUPLICATE_CALLBACK",
  "PAYMENT_AMOUNT_MISMATCH",
  "PAYMENT_CALLBACK_IGNORED",
  "INTERNAL_ERROR",
]);

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorShapeSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string(),
  safeUserMessage: z.string().optional(),
});

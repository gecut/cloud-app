import { z } from "zod";

export const systemSimulateCallbackInputSchema = z.object({
  invoiceId: z.string(),
  provider: z.string().min(2),
  gatewayRef: z.string().min(4),
  amountToman: z.number().int().min(0),
  success: z.boolean(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

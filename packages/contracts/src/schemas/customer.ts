import { z } from "zod";

import { paginationInputSchema } from "../common/pagination";
import {
  invoiceStatusSchema,
  paymentAttemptStatusSchema,
  searchSchema,
} from "./shared";

export const customerInvoiceListInputSchema = paginationInputSchema
  .extend(searchSchema.shape)
  .extend({
    status: invoiceStatusSchema.optional(),
  });

export const customerPaymentAttemptsListInputSchema =
  paginationInputSchema.extend({
    status: paymentAttemptStatusSchema.optional(),
  });

export const customerServiceListInputSchema = paginationInputSchema
  .extend(searchSchema.shape)
  .optional();

export const customerEndpointListByServiceInputSchema = z.object({
  serviceId: z.string(),
});

export const customerSimulatePayInvoiceInputSchema = z.object({
  invoiceId: z.string(),
  provider: z.string().min(2),
  gatewayRef: z.string().min(4),
  amountToman: z.number().int().min(0),
});

import { z } from "zod";

import { dateRangeSchema, paginationInputSchema } from "../common/pagination";
import {
  customerStatusSchema,
  endpointTypeSchema,
  invoiceStatusSchema,
  moneySchema,
  paymentAttemptStatusSchema,
  searchSchema,
  serverStatusSchema,
  serverVisibilityLevelSchema,
  serviceGroupStatusSchema,
  serviceStatusSchema,
} from "./shared";

export const adminCustomerListInputSchema = paginationInputSchema.extend(searchSchema.shape).extend({
  status: customerStatusSchema.optional(),
});

export const adminCustomerCreateInputSchema = z.object({
  name: z.string().min(2),
  displayName: z.string().min(2).optional(),
  phone: z.string().min(10).max(20),
  email: z.email().optional(),
  password: z.string().min(8),
});

export const adminCustomerUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  displayName: z.string().min(2).nullable().optional(),
  email: z.email().nullable().optional(),
  phone: z.string().min(10).max(20).optional(),
});

export const adminServiceGroupListInputSchema = paginationInputSchema.extend(searchSchema.shape).extend({
  customerId: z.string().optional(),
  status: serviceGroupStatusSchema.optional(),
});

export const adminServiceGroupCreateInputSchema = z.object({
  customerId: z.string(),
  name: z.string().min(2),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
});

export const adminServiceGroupUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().nullable().optional(),
});

export const adminServiceGroupReorderInputSchema = z.object({
  customerId: z.string(),
  groupIds: z.array(z.string()).min(1),
});

export const adminServiceTypeCreateInputSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const adminServiceTypeUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().nullable().optional(),
});

export const adminServiceListInputSchema = paginationInputSchema
  .extend(searchSchema.shape)
  .extend(dateRangeSchema.shape)
  .extend({
    customerId: z.string().optional(),
    status: serviceStatusSchema.optional(),
    serviceTypeId: z.string().optional(),
  });

export const adminServiceCreateInputSchema = z.object({
  customerId: z.string(),
  serviceGroupId: z.string().nullable().optional(),
  serviceTypeId: z.string(),
  serverId: z.string().nullable().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  status: serviceStatusSchema.default("ACTIVE"),
  priceToman: moneySchema,
  startDate: z.coerce.date(),
  renewalDate: z.coerce.date(),
  serverVisibilityLevel: serverVisibilityLevelSchema.default("NONE"),
});

export const adminServiceUpdateInputSchema = z.object({
  id: z.string(),
  serviceGroupId: z.string().nullable().optional(),
  serviceTypeId: z.string().optional(),
  serverId: z.string().nullable().optional(),
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  status: serviceStatusSchema.optional(),
  priceToman: moneySchema.optional(),
  startDate: z.coerce.date().optional(),
  renewalDate: z.coerce.date().optional(),
  serverVisibilityLevel: serverVisibilityLevelSchema.optional(),
});

export const adminEndpointCreateInputSchema = z.object({
  serviceId: z.string(),
  label: z.string().min(2),
  url: z.url(),
  type: endpointTypeSchema,
  isPublic: z.boolean().default(false),
  isActive: z.boolean().default(true),
  provider: z.string().optional(),
  externalMonitorId: z.string().optional(),
});

export const adminEndpointUpdateInputSchema = z.object({
  id: z.string(),
  label: z.string().min(2).optional(),
  url: z.url().optional(),
  type: endpointTypeSchema.optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
  provider: z.string().nullable().optional(),
  externalMonitorId: z.string().nullable().optional(),
});

export const adminEndpointUpdateUptimeInputSchema = z.object({
  id: z.string(),
  status: z.string().optional(),
  uptimePercentage30d: z.number().min(0).max(100).optional(),
  responseTimeMs: z.number().int().min(0).optional(),
  lastCheckedAt: z.coerce.date().optional(),
});

export const adminServerCreateInputSchema = z.object({
  name: z.string().min(2),
  provider: z.string().min(2),
  status: serverStatusSchema.default("ACTIVE"),
  ipAddress: z.string().optional(),
  domain: z.string().optional(),
  location: z.string().optional(),
  cpu: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  monthlyCostToman: moneySchema.optional(),
  internalNotes: z.string().optional(),
});

export const adminServerUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  provider: z.string().min(2).optional(),
  status: serverStatusSchema.optional(),
  ipAddress: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  cpu: z.string().nullable().optional(),
  ram: z.string().nullable().optional(),
  storage: z.string().nullable().optional(),
  monthlyCostToman: moneySchema.nullable().optional(),
  internalNotes: z.string().nullable().optional(),
});

export const adminInvoiceListInputSchema = paginationInputSchema
  .extend(searchSchema.shape)
  .extend(dateRangeSchema.shape)
  .extend({
    customerId: z.string().optional(),
    status: invoiceStatusSchema.optional(),
  });

export const adminInvoiceItemInputSchema = z.object({
  serviceId: z.string().nullable().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPriceToman: moneySchema,
});

export const adminInvoiceCreateInputSchema = z.object({
  customerId: z.string(),
  dueDate: z.coerce.date(),
  notes: z.string().optional(),
  items: z.array(adminInvoiceItemInputSchema).min(1),
});

export const adminInvoiceUpdateUnpaidInputSchema = z.object({
  id: z.string(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(adminInvoiceItemInputSchema).min(1).optional(),
});

export const adminPaymentSimulateInputSchema = z.object({
  invoiceId: z.string(),
  provider: z.string().min(2),
  gatewayRef: z.string().min(4),
  amountToman: moneySchema,
});

export const adminPaymentSimulateFailureInputSchema = adminPaymentSimulateInputSchema.extend({
  status: paymentAttemptStatusSchema.default("FAILED"),
  errorCode: z.string().min(2),
  errorMessage: z.string().min(2),
});

export const adminPaymentRetryInputSchema = z.object({
  attemptId: z.string(),
  gatewayRef: z.string().min(4),
});

export const adminAuditListInputSchema = paginationInputSchema
  .extend(dateRangeSchema.shape)
  .extend({
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    actor: z.string().optional(),
    action: z.string().optional(),
  });

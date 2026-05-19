import {
  adminAuditListInputSchema,
  adminCustomerCreateInputSchema,
  adminCustomerListInputSchema,
  adminCustomerUpdateInputSchema,
  adminEndpointCreateInputSchema,
  adminEndpointUpdateInputSchema,
  adminEndpointUpdateUptimeInputSchema,
  adminInvoiceCreateInputSchema,
  adminInvoiceListInputSchema,
  adminInvoiceUpdateUnpaidInputSchema,
  adminPaymentRetryInputSchema,
  adminPaymentSimulateFailureInputSchema,
  adminPaymentSimulateInputSchema,
  adminServerCreateInputSchema,
  adminServerUpdateInputSchema,
  adminServiceCreateInputSchema,
  adminServiceGroupCreateInputSchema,
  adminServiceGroupListInputSchema,
  adminServiceGroupReorderInputSchema,
  adminServiceGroupUpdateInputSchema,
  adminServiceListInputSchema,
  adminServiceTypeCreateInputSchema,
  adminServiceTypeUpdateInputSchema,
  adminServiceUpdateInputSchema,
  customerStatusSchema,
  idInputSchema,
  serverStatusSchema,
  serverVisibilityLevelSchema,
  serviceGroupStatusSchema,
  serviceStatusSchema,
} from "@gecut-cloud/contracts";
import {
  cancelUnpaidInvoice,
  createCustomer,
  createEndpoint,
  createInvoice,
  createServer,
  createService,
  createServiceGroup,
  createServiceType,
  getAdminDashboardSummary,
  getAuditById,
  getCustomerById,
  getEndpointById,
  getInvoiceById,
  getInvoiceItems,
  getPaymentByInvoiceId,
  getServerById,
  getServerHostedServices,
  getServiceById,
  getServiceGroupById,
  listAudit,
  listCustomers,
  listEndpoints,
  listInvoices,
  listPaymentAttempts,
  listServers,
  listServiceGroups,
  listServices,
  listServiceTypes,
  listSuccessfulPayments,
  reorderServiceGroups,
  retryFailedAttempt,
  setCustomerStatus,
  setEndpointActive,
  setEndpointVisibility,
  setServerStatus,
  setServiceGroupStatus,
  setServiceStatus,
  setServiceTypeActive,
  simulatePaymentFailure,
  simulatePaymentSuccess,
  updateCustomer,
  updateEndpoint,
  updateEndpointUptimeSummary,
  updateServer,
  updateService,
  updateServiceGroup,
  updateServiceServerVisibility,
  updateServiceType,
  updateUnpaidInvoice,
} from "@gecut-cloud/core";
import { z } from "zod";

import { publicProcedure } from "../../index";
import { requireAdmin } from "../../procedures/guards";
import { withErrorHandling } from "../../procedures/errors";

function actorFromContext(context: Parameters<typeof requireAdmin>[0]) {
  const auth = requireAdmin(context);

  return {
    userId: auth.session.userId,
    role: auth.session.role,
    displayName: auth.user.name,
  };
}

export const adminRouter = {
  customers: {
    list: publicProcedure.input(adminCustomerListInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return listCustomers(input);
      }),
    ),
    getById: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return getCustomerById(input.id);
      }),
    ),
    create: publicProcedure.input(adminCustomerCreateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return createCustomer(actorFromContext(context), input);
      }),
    ),
    update: publicProcedure.input(adminCustomerUpdateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return updateCustomer(actorFromContext(context), input);
      }),
    ),
    suspend: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return setCustomerStatus(actorFromContext(context), input.id, "SUSPENDED");
      }),
    ),
    activate: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return setCustomerStatus(actorFromContext(context), input.id, "ACTIVE");
      }),
    ),
    deactivate: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return setCustomerStatus(actorFromContext(context), input.id, "INACTIVE");
      }),
    ),
    setStatus: publicProcedure
      .input(z.object({ id: z.string(), status: customerStatusSchema }))
      .handler(
        withErrorHandling(async ({ input, context }) => {
          return setCustomerStatus(actorFromContext(context), input.id, input.status);
        }),
      ),
  },
  serviceGroups: {
    list: publicProcedure.input(adminServiceGroupListInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return listServiceGroups(input);
      }),
    ),
    getById: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return getServiceGroupById(input.id);
      }),
    ),
    create: publicProcedure.input(adminServiceGroupCreateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return createServiceGroup(actorFromContext(context), input);
      }),
    ),
    update: publicProcedure.input(adminServiceGroupUpdateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return updateServiceGroup(actorFromContext(context), input);
      }),
    ),
    suspend: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return setServiceGroupStatus(actorFromContext(context), input.id, "SUSPENDED");
      }),
    ),
    archive: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return setServiceGroupStatus(actorFromContext(context), input.id, "ARCHIVED");
      }),
    ),
    setStatus: publicProcedure
      .input(z.object({ id: z.string(), status: serviceGroupStatusSchema }))
      .handler(
        withErrorHandling(async ({ input, context }) => {
          return setServiceGroupStatus(actorFromContext(context), input.id, input.status);
        }),
      ),
    reorder: publicProcedure.input(adminServiceGroupReorderInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return reorderServiceGroups(actorFromContext(context), input);
      }),
    ),
  },
  serviceTypes: {
    list: publicProcedure
      .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), search: z.string().optional() }))
      .handler(
        withErrorHandling(async ({ input, context }) => {
          requireAdmin(context);
          return listServiceTypes(input);
        }),
      ),
    create: publicProcedure.input(adminServiceTypeCreateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return createServiceType(actorFromContext(context), input);
      }),
    ),
    update: publicProcedure.input(adminServiceTypeUpdateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return updateServiceType(actorFromContext(context), input);
      }),
    ),
    activate: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return setServiceTypeActive(actorFromContext(context), input.id, true);
      }),
    ),
    deactivate: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return setServiceTypeActive(actorFromContext(context), input.id, false);
      }),
    ),
  },
  services: {
    list: publicProcedure.input(adminServiceListInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return listServices(input);
      }),
    ),
    getById: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return getServiceById(input.id);
      }),
    ),
    create: publicProcedure.input(adminServiceCreateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return createService(actorFromContext(context), input);
      }),
    ),
    update: publicProcedure.input(adminServiceUpdateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return updateService(actorFromContext(context), input);
      }),
    ),
    suspend: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return setServiceStatus(actorFromContext(context), input.id, "SUSPENDED");
      }),
    ),
    activate: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return setServiceStatus(actorFromContext(context), input.id, "ACTIVE");
      }),
    ),
    deactivate: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return setServiceStatus(actorFromContext(context), input.id, "INACTIVE");
      }),
    ),
    setStatus: publicProcedure
      .input(z.object({ id: z.string(), status: serviceStatusSchema }))
      .handler(
        withErrorHandling(async ({ input, context }) => {
          return setServiceStatus(actorFromContext(context), input.id, input.status);
        }),
      ),
    updateServerVisibility: publicProcedure
      .input(z.object({ id: z.string(), serverVisibilityLevel: serverVisibilityLevelSchema }))
      .handler(
        withErrorHandling(async ({ input, context }) => {
          return updateServiceServerVisibility(actorFromContext(context), input.id, input.serverVisibilityLevel);
        }),
      ),
  },
  endpoints: {
    list: publicProcedure
      .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), search: z.string().optional(), serviceId: z.string().optional() }))
      .handler(
        withErrorHandling(async ({ input, context }) => {
          requireAdmin(context);
          return listEndpoints(input);
        }),
      ),
    getById: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return getEndpointById(input.id);
      }),
    ),
    create: publicProcedure.input(adminEndpointCreateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return createEndpoint(actorFromContext(context), input);
      }),
    ),
    update: publicProcedure.input(adminEndpointUpdateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return updateEndpoint(actorFromContext(context), input);
      }),
    ),
    setActive: publicProcedure.input(z.object({ id: z.string(), isActive: z.boolean() })).handler(
      withErrorHandling(async ({ input, context }) => {
        return setEndpointActive(actorFromContext(context), input.id, input.isActive);
      }),
    ),
    setVisibility: publicProcedure.input(z.object({ id: z.string(), isPublic: z.boolean() })).handler(
      withErrorHandling(async ({ input, context }) => {
        return setEndpointVisibility(actorFromContext(context), input.id, input.isPublic);
      }),
    ),
    updateUptimeSummary: publicProcedure.input(adminEndpointUpdateUptimeInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return updateEndpointUptimeSummary(actorFromContext(context), input);
      }),
    ),
  },
  servers: {
    list: publicProcedure
      .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), search: z.string().optional(), status: serverStatusSchema.optional() }))
      .handler(
        withErrorHandling(async ({ input, context }) => {
          requireAdmin(context);
          return listServers(input);
        }),
      ),
    getById: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return getServerById(input.id);
      }),
    ),
    create: publicProcedure.input(adminServerCreateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return createServer(actorFromContext(context), input);
      }),
    ),
    update: publicProcedure.input(adminServerUpdateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return updateServer(actorFromContext(context), input);
      }),
    ),
    setStatus: publicProcedure.input(z.object({ id: z.string(), status: serverStatusSchema })).handler(
      withErrorHandling(async ({ input, context }) => {
        return setServerStatus(actorFromContext(context), input.id, input.status);
      }),
    ),
    getHostedServices: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return getServerHostedServices(input.id);
      }),
    ),
  },
  invoices: {
    list: publicProcedure.input(adminInvoiceListInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return listInvoices(input);
      }),
    ),
    getById: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return getInvoiceById(input.id);
      }),
    ),
    getInvoiceItems: publicProcedure.input(z.object({ invoiceId: z.string() })).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return getInvoiceItems(input.invoiceId);
      }),
    ),
    create: publicProcedure.input(adminInvoiceCreateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return createInvoice(actorFromContext(context), input);
      }),
    ),
    updateUnpaid: publicProcedure.input(adminInvoiceUpdateUnpaidInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return updateUnpaidInvoice(actorFromContext(context), input);
      }),
    ),
    cancelUnpaid: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return cancelUnpaidInvoice(actorFromContext(context), input.id);
      }),
    ),
  },
  payments: {
    listSuccessful: publicProcedure
      .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), search: z.string().optional() }))
      .handler(
        withErrorHandling(async ({ input, context }) => {
          requireAdmin(context);
          return listSuccessfulPayments(input);
        }),
      ),
    listAttempts: publicProcedure
      .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), status: z.enum(["FAILED", "CANCELLED", "EXPIRED", "UNKNOWN"]).optional() }))
      .handler(
        withErrorHandling(async ({ input, context }) => {
          requireAdmin(context);
          return listPaymentAttempts(input);
        }),
      ),
    getByInvoiceId: publicProcedure.input(z.object({ invoiceId: z.string() })).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return getPaymentByInvoiceId(input.invoiceId);
      }),
    ),
    simulateSuccess: publicProcedure.input(adminPaymentSimulateInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return simulatePaymentSuccess(actorFromContext(context), input);
      }),
    ),
    simulateFailure: publicProcedure.input(adminPaymentSimulateFailureInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return simulatePaymentFailure(actorFromContext(context), input);
      }),
    ),
    retryFailedAttempt: publicProcedure.input(adminPaymentRetryInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        return retryFailedAttempt(actorFromContext(context), input);
      }),
    ),
  },
  audit: {
    list: publicProcedure.input(adminAuditListInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return listAudit(input);
      }),
    ),
    getById: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        requireAdmin(context);
        return getAuditById(input.id);
      }),
    ),
  },
  dashboard: {
    getSummary: publicProcedure.handler(
      withErrorHandling(async ({ context }) => {
        requireAdmin(context);
        return getAdminDashboardSummary();
      }),
    ),
  },
};

import {
  customerEndpointListByServiceInputSchema,
  customerInvoiceListInputSchema,
  customerPaymentAttemptsListInputSchema,
  customerServiceListInputSchema,
  customerSimulatePayInvoiceInputSchema,
  idInputSchema,
} from "@gecut-cloud/contracts";
import {
  getCustomerDashboardSummary,
  getInvoicePaymentStatus,
  getMyInvoiceById,
  getMyInvoiceItems,
  getMyServiceById,
  getMyServiceEndpoints,
  listMyInvoices,
  listMyPaymentAttempts,
  listMyServices,
  simulatePayInvoice,
} from "@gecut-cloud/core";

import { publicProcedure } from "../../index";
import { requireCustomer } from "../../procedures/guards";
import { withErrorHandling } from "../../procedures/errors";

export const customerRouter = {
  services: {
    listMyServices: publicProcedure
      .input(customerServiceListInputSchema)
      .handler(
        withErrorHandling(async ({ input, context }) => {
          const auth = requireCustomer(context);
          return listMyServices(
            auth.session.customerId,
            input ?? { pageSize: 100, page: 1 }
          );
        })
      ),
    getMyServiceById: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        const auth = requireCustomer(context);
        return getMyServiceById(auth.session.customerId, input.id);
      })
    ),
    getMyServiceEndpoints: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        const auth = requireCustomer(context);
        return getMyServiceEndpoints(auth.session.customerId, input.id);
      })
    ),
  },
  invoices: {
    listMyInvoices: publicProcedure
      .input(customerInvoiceListInputSchema)
      .handler(
        withErrorHandling(async ({ input, context }) => {
          const auth = requireCustomer(context);
          return listMyInvoices(auth.session.customerId, input);
        })
      ),
    getMyInvoiceById: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        const auth = requireCustomer(context);
        return getMyInvoiceById(auth.session.customerId, input.id);
      })
    ),
    getMyInvoiceItems: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        const auth = requireCustomer(context);
        return getMyInvoiceItems(auth.session.customerId, input.id);
      })
    ),
  },
  payments: {
    getInvoicePaymentStatus: publicProcedure.input(idInputSchema).handler(
      withErrorHandling(async ({ input, context }) => {
        const auth = requireCustomer(context);
        return getInvoicePaymentStatus(auth.session.customerId, input.id);
      })
    ),
    simulatePayInvoice: publicProcedure
      .input(customerSimulatePayInvoiceInputSchema)
      .handler(
        withErrorHandling(async ({ input, context }) => {
          const auth = requireCustomer(context);
          return simulatePayInvoice(auth.session.customerId, input);
        })
      ),
    listMyPaymentAttempts: publicProcedure
      .input(customerPaymentAttemptsListInputSchema)
      .handler(
        withErrorHandling(async ({ input, context }) => {
          const auth = requireCustomer(context);
          return listMyPaymentAttempts(auth.session.customerId, input);
        })
      ),
  },
  dashboard: {
    getSummary: publicProcedure.handler(
      withErrorHandling(async ({ context }) => {
        const auth = requireCustomer(context);
        return getCustomerDashboardSummary(auth.session.customerId);
      })
    ),
  },
  endpoints: {
    listByService: publicProcedure
      .input(customerEndpointListByServiceInputSchema)
      .handler(
        withErrorHandling(async ({ input, context }) => {
          const auth = requireCustomer(context);
          return getMyServiceEndpoints(
            auth.session.customerId,
            input.serviceId
          );
        })
      ),
  },
};

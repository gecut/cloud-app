import { systemSimulateCallbackInputSchema } from "@gecut-cloud/contracts";
import { simulatePaymentCallback } from "@gecut-cloud/core";

import { publicProcedure } from "../../index";
import { withErrorHandling } from "../../procedures/errors";

export const systemRouter = {
  payments: {
    simulateCallback: publicProcedure.input(systemSimulateCallbackInputSchema).handler(
      withErrorHandling(async ({ input }) => {
        return simulatePaymentCallback(input);
      }),
    ),
  },
};

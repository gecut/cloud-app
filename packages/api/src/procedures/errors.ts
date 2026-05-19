import { ORPCError } from "@orpc/server";
import { AppError } from "@gecut-cloud/core";

function mapErrorCodeToORPC(code: AppError["code"]) {
  switch (code) {
    case "AUTH_UNAUTHORIZED":
      return "UNAUTHORIZED" as const;
    case "AUTH_FORBIDDEN":
    case "TENANT_ACCESS_DENIED":
      return "FORBIDDEN" as const;
    case "RESOURCE_NOT_FOUND":
      return "NOT_FOUND" as const;
    case "VALIDATION_FAILED":
    case "INVOICE_LOCKED":
    case "INVOICE_INVALID_STATUS":
    case "PAYMENT_DUPLICATE_CALLBACK":
    case "PAYMENT_AMOUNT_MISMATCH":
    case "PAYMENT_CALLBACK_IGNORED":
    case "AUTH_INVALID_CREDENTIALS":
      return "BAD_REQUEST" as const;
    default:
      return "INTERNAL_SERVER_ERROR" as const;
  }
}

export function toORPCError(error: unknown) {
  if (error instanceof ORPCError) {
    return error;
  }

  if (error instanceof AppError) {
    return new ORPCError(mapErrorCodeToORPC(error.code), {
      message: error.message,
      data: {
        code: error.code,
        safeUserMessage: error.safeUserMessage,
      },
    });
  }

  return new ORPCError("INTERNAL_SERVER_ERROR", {
    message: "Unhandled server error",
    data: {
      code: "INTERNAL_ERROR",
      safeUserMessage: "خطای غیرمنتظره‌ای رخ داد",
    },
  });
}

export function withErrorHandling<TOptions, TResult>(fn: (options: TOptions) => Promise<TResult> | TResult) {
  return async (options: TOptions): Promise<TResult> => {
    try {
      return await fn(options);
    } catch (error) {
      throw toORPCError(error);
    }
  };
}

import type { ApiErrorCode } from "@gecut-cloud/contracts";

export class AppError extends Error {
  code: ApiErrorCode;
  safeUserMessage?: string;

  constructor(code: ApiErrorCode, message: string, safeUserMessage?: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.safeUserMessage = safeUserMessage;
  }
}

export function assertOrThrow(
  condition: unknown,
  code: ApiErrorCode,
  message: string,
  safeUserMessage?: string,
): asserts condition {
  if (!condition) {
    throw new AppError(code, message, safeUserMessage);
  }
}

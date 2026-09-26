import { z } from "zod";

// ==========================================
// 1. Errors
// ==========================================

export interface PaymentGatewayErrorOptions {
  gateway?: string;
  code?: string | number;
  message: string;
  userMessage?: string;
  cause?: unknown;
  details?: unknown;
}

export class PaymentGatewayError extends Error {
  public readonly gateway: string;
  public readonly code?: string | number;
  public readonly userMessage: string;
  public readonly details?: unknown;

  constructor(options: PaymentGatewayErrorOptions) {
    super(options.message);
    this.name = "PaymentGatewayError";
    this.gateway = options.gateway || "ZIBAL";
    this.code = options.code;
    this.userMessage =
      options.userMessage || "خطا در ارتباط با درگاه پرداخت. لطفاً مجدداً تلاش نمایید.";
    this.details = options.details;
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

export class PaymentRequestError extends PaymentGatewayError {
  constructor(options: Omit<PaymentGatewayErrorOptions, "gateway"> & { gateway?: string }) {
    super({
      ...options,
      gateway: options.gateway || "ZIBAL",
      message: `[${options.gateway || "ZIBAL"}] Payment request failed: ${options.message}`,
      userMessage: options.userMessage || "خطا در ایجاد تراکنش درگاه پرداخت. لطفاً دوباره تلاش کنید.",
    });
    this.name = "PaymentRequestError";
  }
}

export class PaymentVerificationError extends PaymentGatewayError {
  constructor(options: Omit<PaymentGatewayErrorOptions, "gateway"> & { gateway?: string }) {
    super({
      ...options,
      gateway: options.gateway || "ZIBAL",
      message: `[${options.gateway || "ZIBAL"}] Payment verification failed: ${options.message}`,
      userMessage: options.userMessage || "تایید تراکنش پرداخت با خطا مواجه شد.",
    });
    this.name = "PaymentVerificationError";
  }
}

export class PaymentAmountMismatchError extends PaymentGatewayError {
  public readonly expectedAmountToman: number;
  public readonly actualAmountToman: number;

  constructor(expectedToman: number, actualToman: number) {
    super({
      code: "AMOUNT_MISMATCH",
      message: `Payment amount mismatch: expected ${expectedToman} Toman, but received ${actualToman} Toman`,
      userMessage:
        "مبلغ پرداخت‌شده با مبلغ فاکتور همخوانی ندارد. جهت بررسی با پشتیبانی تماس بگیرید.",
      details: { expectedToman, actualToman },
    });
    this.name = "PaymentAmountMismatchError";
    this.expectedAmountToman = expectedToman;
    this.actualAmountToman = actualToman;
  }
}

export class PaymentInvalidCallbackError extends PaymentGatewayError {
  constructor(message: string, userMessage?: string) {
    super({
      code: "INVALID_CALLBACK",
      message,
      userMessage:
        userMessage || "اطلاعات بازگشتی از درگاه پرداخت نامعتبر یا ناقص است.",
    });
    this.name = "PaymentInvalidCallbackError";
  }
}

// ==========================================
// 2. Types & Status Codes
// ==========================================

export const ZIBAL_STATUS_CODES: Record<number, { title: string; isSuccess: boolean; descriptionFa: string }> = {
  [-1]: { title: "WAITING_FOR_PAYMENT", isSuccess: false, descriptionFa: "در انتظار پرداخت" },
  [-2]: { title: "INTERNAL_ERROR", isSuccess: false, descriptionFa: "خطای داخلی درگاه" },
  [1]: { title: "PAID_AND_VERIFIED", isSuccess: true, descriptionFa: "پرداخت شده - تایید شده" },
  [2]: { title: "PAID_UNVERIFIED", isSuccess: true, descriptionFa: "پرداخت شده - در انتظار تایید" },
  [3]: { title: "CANCELLED_BY_USER", isSuccess: false, descriptionFa: "لغو شده توسط کاربر" },
  [4]: { title: "INVALID_CARD_NUMBER", isSuccess: false, descriptionFa: "شماره کارت نامعتبر می‌باشد" },
  [5]: { title: "INSUFFICIENT_FUNDS", isSuccess: false, descriptionFa: "موجودی حساب کافی نمی‌باشد" },
  [6]: { title: "WRONG_PASSWORD", isSuccess: false, descriptionFa: "رمز وارد شده اشتباه می‌باشد" },
  [7]: { title: "TOO_MANY_REQUESTS", isSuccess: false, descriptionFa: "تعداد درخواست‌ها بیش از حد مجاز است" },
  [8]: { title: "DAILY_COUNT_LIMIT", isSuccess: false, descriptionFa: "تعداد پرداخت اینترنتی روزانه بیش از حد مجاز است" },
  [9]: { title: "DAILY_AMOUNT_LIMIT", isSuccess: false, descriptionFa: "مبلغ پرداخت اینترنتی روزانه بیش از حد مجاز است" },
  [10]: { title: "INVALID_CARD_ISSUER", isSuccess: false, descriptionFa: "صادرکننده کارت نامعتبر است" },
  [11]: { title: "SWITCH_ERROR", isSuccess: false, descriptionFa: "خطای سوییچ بانکی" },
  [12]: { title: "CARD_INACCESSIBLE", isSuccess: false, descriptionFa: "کارت قابل دسترسی نمی‌باشد" },
  [15]: { title: "REFUNDED", isSuccess: false, descriptionFa: "تراکنش استرداد شده است" },
  [16]: { title: "REFUNDING", isSuccess: false, descriptionFa: "تراکنش در حال استرداد است" },
  [18]: { title: "REVERSED", isSuccess: false, descriptionFa: "تراکنش ریورس (برگشت) داده شده است" },
  [21]: { title: "INVALID_MERCHANT", isSuccess: false, descriptionFa: "پذیرنده نامعتبر است" },
};

export const ZIBAL_REQUEST_RESULTS: Record<number, string> = {
  100: "با موفقیت انجام شد",
  102: "مرچنت یافت نشد (merchant نامعتبر است)",
  103: "مرچنت غیرفعال است",
  104: "مرچنت نامعتبر است",
  105: "مبلغ ارسالی باید بزرگتر از ۱۰۰۰ ریال (۱۰۰ تومان) باشد",
  106: "آدرس بازگشت (callbackUrl) نامعتبر است",
  113: "مبلغ تراکنش از سقف مجاز بیشتر است",
};

export const ZIBAL_VERIFY_RESULTS: Record<number, string> = {
  100: "تراکنش با موفقیت تایید شد",
  102: "مرچنت یافت نشد",
  103: "مرچنت غیرفعال است",
  104: "مرچنت نامعتبر است",
  201: "تراکنش قبلاً تایید شده است (تکراری)",
  202: "سفارش پرداخت نشده یا ناموفق بوده است",
  203: "شناسه پیگیری (trackId) نامعتبر است",
};

export interface ZibalConfig {
  merchant?: string;
  baseUrl?: string;
  defaultCallbackUrl?: string;
  timeoutMs?: number;
}

export const ZibalPaymentRequestInputSchema = z.object({
  amountRials: z.number().int().positive("Amount in Rials must be a positive integer"),
  callbackUrl: z.string().url("Invalid callback URL"),
  description: z.string().max(500).optional(),
  orderId: z.string().max(100).optional(),
  mobile: z.string().optional(),
  allowedCards: z.array(z.string()).optional(),
  nationalCode: z.string().length(10).optional(),
  checkMobileWithCard: z.boolean().optional(),
});

export type ZibalPaymentRequestInput = z.infer<typeof ZibalPaymentRequestInputSchema>;

export interface ZibalPaymentRequestResult {
  trackId: number;
  result: number;
  message: string;
  paymentUrl: string;
}

export const ZibalVerifyInputSchema = z.object({
  trackId: z.union([z.number().int(), z.string().regex(/^\d+$/)]).transform((v) => Number(v)),
  merchant: z.string().optional(),
});

export type ZibalVerifyInput = z.infer<typeof ZibalVerifyInputSchema>;

export interface ZibalVerifyResult {
  paidAt?: string;
  amountRials: number;
  amountToman: number;
  result: number;
  status: number;
  refNumber?: number;
  description?: string;
  cardNumber?: string;
  orderId?: string;
  message: string;
  isNewlyVerified: boolean;
  isAlreadyVerified: boolean;
}

export interface ZibalParsedCallback {
  trackId: number;
  isSuccess: boolean;
  status: number;
  statusTextFa: string;
  orderId?: string;
  raw: Record<string, string | number | undefined>;
}

// ==========================================
// 3. Zibal Client Implementation
// ==========================================

export class ZibalClient {
  public readonly merchant: string;
  public readonly baseUrl: string;
  public readonly defaultCallbackUrl?: string;
  public readonly timeoutMs: number;

  constructor(config: ZibalConfig = {}) {
    this.merchant = config.merchant || "zibal";
    this.baseUrl = (config.baseUrl || "https://gateway.zibal.ir").replace(/\/+$/, "");
    this.defaultCallbackUrl = config.defaultCallbackUrl;
    this.timeoutMs = config.timeoutMs || 15000;
  }

  /**
   * Generates the payment gateway redirect URL for a given trackId
   */
  public getPaymentUrl(trackId: number | string): string {
    if (!trackId) {
      throw new PaymentGatewayError({
        message: "trackId is required to generate payment URL",
        userMessage: "شناسه پیگیری پرداخت موجود نیست.",
      });
    }
    return `${this.baseUrl}/start/${trackId}`;
  }

  /**
   * Request a new payment session from Zibal
   */
  public async requestPayment(
    input: ZibalPaymentRequestInput,
  ): Promise<ZibalPaymentRequestResult> {
    const validated = ZibalPaymentRequestInputSchema.parse(input);

    const payload = {
      merchant: this.merchant,
      amount: validated.amountRials,
      callbackUrl: validated.callbackUrl || this.defaultCallbackUrl,
      description: validated.description,
      orderId: validated.orderId,
      mobile: validated.mobile,
      allowedCards: validated.allowedCards,
      nationalCode: validated.nationalCode,
      checkMobileWithCard: validated.checkMobileWithCard,
    };

    if (!payload.callbackUrl) {
      throw new PaymentRequestError({
        code: 106,
        message: "Callback URL is required",
        userMessage: "آدرس بازگشت (callbackUrl) مشخص نشده است.",
      });
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        throw new PaymentRequestError({
          code: `HTTP_${response.status}`,
          message: `Gateway responded with HTTP ${response.status}: ${response.statusText}`,
          userMessage: "پاسخ ناموفق از سرور درگاه زیبال دریافت شد.",
        });
      }

      const data = (await response.json()) as {
        trackId?: number;
        result?: number;
        message?: string;
      };

      if (data.result !== 100 || !data.trackId) {
        const errorFa =
          (data.result && ZIBAL_REQUEST_RESULTS[data.result]) ||
          data.message ||
          "خطای نامشخص در ایجاد تراکنش";

        throw new PaymentRequestError({
          code: data.result,
          message: `Zibal request error [code ${data.result}]: ${data.message || "Unknown error"}`,
          userMessage: errorFa,
          details: data,
        });
      }

      return {
        trackId: data.trackId,
        result: data.result,
        message: data.message || "success",
        paymentUrl: this.getPaymentUrl(data.trackId),
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      throw new PaymentRequestError({
        message: error instanceof Error ? error.message : String(error),
        userMessage: "خطا در اتصال به درگاه پرداخت زیبال یا زمان پاسخ‌دهی به پایان رسید.",
        cause: error,
      });
    }
  }

  /**
   * Verifies a payment with Zibal server-side
   */
  public async verifyPayment(input: ZibalVerifyInput): Promise<ZibalVerifyResult> {
    const validated = ZibalVerifyInputSchema.parse(input);

    const payload = {
      merchant: validated.merchant || this.merchant,
      trackId: validated.trackId,
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        throw new PaymentVerificationError({
          code: `HTTP_${response.status}`,
          message: `Gateway verify responded with HTTP ${response.status}: ${response.statusText}`,
          userMessage: "پاسخ ناموفق از سرور تایید درگاه زیبال دریافت شد.",
        });
      }

      const data = (await response.json()) as {
        paidAt?: string;
        amount?: number;
        result?: number;
        status?: number;
        refNumber?: number;
        description?: string;
        cardNumber?: string;
        orderId?: string;
        message?: string;
      };

      const result = Number(data.result);
      const isNewlyVerified = result === 100;
      const isAlreadyVerified = result === 201;

      if (!isNewlyVerified && !isAlreadyVerified) {
        const errorFa =
          (result && ZIBAL_VERIFY_RESULTS[result]) ||
          (data.status && ZIBAL_STATUS_CODES[data.status]?.descriptionFa) ||
          data.message ||
          "تایید پرداخت ناموفق بود";

        throw new PaymentVerificationError({
          code: result,
          message: `Zibal verify rejected [code ${result}, status ${data.status}]: ${data.message || "Unverified"}`,
          userMessage: errorFa,
          details: data,
        });
      }

      const amountRials = Number(data.amount || 0);
      const amountToman = Math.floor(amountRials / 10);

      return {
        paidAt: data.paidAt,
        amountRials,
        amountToman,
        result,
        status: Number(data.status || 1),
        refNumber: data.refNumber,
        description: data.description,
        cardNumber: data.cardNumber,
        orderId: data.orderId,
        message: data.message || "success",
        isNewlyVerified,
        isAlreadyVerified,
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      throw new PaymentVerificationError({
        message: error instanceof Error ? error.message : String(error),
        userMessage: "خطا در فرآیند استعلام و تایید پرداخت از زیبال.",
        cause: error,
      });
    }
  }

  /**
   * Parse and validate callback query parameters sent from Zibal to callbackUrl
   */
  public parseCallback(params: Record<string, unknown>): ZibalParsedCallback {
    if (!params || typeof params !== "object") {
      throw new PaymentInvalidCallbackError("Callback parameters are missing");
    }

    const rawTrackId = params.trackId;
    if (rawTrackId === undefined || rawTrackId === null || String(rawTrackId).trim() === "") {
      throw new PaymentInvalidCallbackError("Missing trackId in callback parameters");
    }

    const trackId = Number(rawTrackId);
    if (isNaN(trackId) || trackId <= 0) {
      throw new PaymentInvalidCallbackError(`Invalid trackId in callback: ${String(rawTrackId)}`);
    }

    const successStr = String(params.success ?? "");
    const isSuccess = successStr === "1" || params.success === 1 || successStr.toLowerCase() === "true";

    const status = Number(params.status ?? (isSuccess ? 2 : 3));
    const statusMeta = ZIBAL_STATUS_CODES[status];
    const statusTextFa = statusMeta?.descriptionFa || (isSuccess ? "پرداخت انجام شد" : "پرداخت ناموفق");

    const orderId = params.orderId !== undefined && params.orderId !== null ? String(params.orderId) : undefined;

    return {
      trackId,
      isSuccess,
      status,
      statusTextFa,
      orderId,
      raw: params as Record<string, string | number | undefined>,
    };
  }
}

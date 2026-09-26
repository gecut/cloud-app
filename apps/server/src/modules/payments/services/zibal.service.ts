import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { env } from "@gecut-cloud/env/server";
import {
  PaymentGatewayError,
  ZibalClient,
} from "@gecut-cloud/payment";
import type { FastifyReply } from "fastify";
import type { CurrentUserData } from "../../../common/decorators/current-user.decorator";
import { PrismaService } from "../../../infrastructure/database/prisma.service";

@Injectable()
export class ZibalService {
  private readonly logger = new Logger(ZibalService.name);
  private readonly zibalClient: ZibalClient;
  private readonly returnUrls = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {
    this.zibalClient = new ZibalClient({
      merchant: env.ZIBAL_MERCHANT || "zibal",
      defaultCallbackUrl: env.ZIBAL_CALLBACK_URL,
    });
  }

  /**
   * Request a new online payment session via Zibal for an invoice
   */
  async requestInvoicePayment(params: {
    invoiceId: string;
    user: CurrentUserData;
    callbackUrl?: string;
    returnUrl?: string;
  }) {
    const { invoiceId, user, callbackUrl, returnUrl } = params;

    this.logger.log(`Zibal payment request started for invoice ${invoiceId}`);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: { include: { user: true } } },
    });

    if (!invoice) {
      throw new NotFoundException("فاکتور مورد نظر یافت نشد");
    }

    if (invoice.status === "PAID") {
      throw new BadRequestException("این فاکتور قبلاً پرداخت و تسویه شده است");
    }

    if (invoice.status === "CANCELLED") {
      throw new BadRequestException("امکان پرداخت فاکتور لغو شده وجود ندارد");
    }

    // Tenant isolation: verify customer ownership
    if (user.role === "CUSTOMER") {
      const custId = user.customerId || user.id;
      const isOwner =
        invoice.customerId === custId ||
        invoice.customer?.userId === user.id ||
        invoice.customer?.id === custId;

      if (!isOwner) {
        throw new ForbiddenException("شما مجاز به پرداخت این فاکتور نیستید");
      }
    }

    if (invoice.totalToman <= 0) {
      throw new BadRequestException("مبلغ فاکتور نامعتبر است");
    }

    // Store return URL mapped to invoice id
    if (returnUrl) {
      this.returnUrls.set(invoice.id, returnUrl);
    }

    // Convert Toman to Rials for Zibal IPG
    const amountRials = invoice.totalToman * 10;
    const serverUrl = (process.env.SERVER_URL || env.SERVER_URL || "http://localhost:3000").replace(/\/+$/, "");
    const finalCallbackUrl =
      callbackUrl ||
      env.ZIBAL_CALLBACK_URL ||
      `${serverUrl}/payments/zibal/callback`;

    const customerPhone =
      invoice.customer?.phone ||
      invoice.customer?.user?.phone ||
      user.phone;

    try {
      const requestResult = await this.zibalClient.requestPayment({
        amountRials,
        callbackUrl: finalCallbackUrl,
        description: `پرداخت آنلاین فاکتور ${invoice.invoiceNumber}`,
        orderId: invoice.id,
        mobile: customerPhone,
      });

      if (returnUrl && requestResult.trackId) {
        this.returnUrls.set(String(requestResult.trackId), returnUrl);
      }

      this.logger.log(
        `Zibal request succeeded: trackId ${requestResult.trackId} for invoice ${invoice.invoiceNumber}`,
      );

      // Record pending attempt for traceability
      await this.prisma.paymentAttempt
        .create({
          data: {
            invoiceId: invoice.id,
            amountToman: invoice.totalToman,
            provider: "ZIBAL",
            gatewayRef: String(requestResult.trackId),
            status: "UNKNOWN",
            attemptedAt: new Date(),
          },
        })
        .catch((err) => {
          this.logger.warn(`Failed to create initial payment attempt: ${err.message}`);
        });

      return {
        trackId: requestResult.trackId,
        paymentUrl: requestResult.paymentUrl,
        amountToman: invoice.totalToman,
        invoiceNumber: invoice.invoiceNumber,
      };
    } catch (error) {
      this.logger.error(
        `Zibal request failed for invoice ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.prisma.paymentAttempt
        .create({
          data: {
            invoiceId: invoice.id,
            amountToman: invoice.totalToman,
            provider: "ZIBAL",
            status: "FAILED",
            errorCode: error instanceof PaymentGatewayError ? String(error.code) : "REQUEST_FAILED",
            errorMessage: error instanceof Error ? error.message : "Request failed",
            attemptedAt: new Date(),
          },
        })
        .catch(() => {});

      if (error instanceof PaymentGatewayError) {
        throw new BadRequestException(error.userMessage);
      }
      throw new BadRequestException("خطا در ایجاد نشست پرداخت زیبال. لطفاً مجدداً تلاش کنید.");
    }
  }

  /**
   * Handle incoming callback from Zibal after customer payment attempt
   */
  async handleCallback(queryParams: Record<string, unknown>, res: FastifyReply) {
    this.logger.log(`Zibal callback received: ${JSON.stringify(queryParams)}`);

    let parsed;
    try {
      parsed = this.zibalClient.parseCallback(queryParams);
    } catch (parseError) {
      this.logger.error(
        `Zibal callback parsing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      );
      const defaultReturn = (process.env.CUSTOMER_APP_URL || env.CUSTOMER_APP_URL || "http://localhost:3002").replace(/\/+$/, "");
      res.status(302).redirect(`${defaultReturn}/payments?status=failed`);
      return;
    }

    const { trackId, isSuccess, status, orderId, statusTextFa } = parsed;

    const returnUrl =
      (trackId ? this.returnUrls.get(String(trackId)) : undefined) ||
      (orderId ? this.returnUrls.get(orderId) : undefined);

    const defaultCustomerApp = (process.env.CUSTOMER_APP_URL || env.CUSTOMER_APP_URL || "http://localhost:3002").replace(/\/+$/, "");
    const targetBase = returnUrl || `${defaultCustomerApp}/payments`;
    const separator = targetBase.includes("?") ? "&" : "?";

    const cleanSuccessRedirect = `${targetBase}${separator}status=success`;
    const cleanFailedRedirect = `${targetBase}${separator}status=failed`;

    if (trackId) this.returnUrls.delete(String(trackId));
    if (orderId) this.returnUrls.delete(orderId);

    // Locate invoice by orderId or trackId in PaymentAttempt
    const invoice = await this.findInvoiceForCallback(orderId, trackId);

    if (!invoice) {
      this.logger.error(`Invoice not found for Zibal callback (trackId: ${trackId}, orderId: ${orderId})`);
      res.status(302).redirect(cleanFailedRedirect);
      return;
    }

    // 1. Handle user cancellation or gateway rejection
    if (!isSuccess) {
      this.logger.warn(
        `Zibal payment failed or was cancelled by user for invoice ${invoice.invoiceNumber} (status: ${status}, trackId: ${trackId})`,
      );

      const attemptStatus = status === 3 ? "CANCELLED" : "FAILED";

      await this.prisma.paymentAttempt
        .create({
          data: {
            invoiceId: invoice.id,
            amountToman: invoice.totalToman,
            provider: "ZIBAL",
            gatewayRef: String(trackId),
            status: attemptStatus,
            errorCode: String(status),
            errorMessage: statusTextFa,
            attemptedAt: new Date(),
          },
        })
        .catch(() => {});

      res.status(302).redirect(cleanFailedRedirect);
      return;
    }

    // 2. Server-side verification with Zibal
    this.logger.log(`Zibal verification started for trackId ${trackId}, invoice ${invoice.invoiceNumber}`);

    let verifyResult;
    try {
      verifyResult = await this.zibalClient.verifyPayment({ trackId });
    } catch (verifyError) {
      this.logger.error(
        `Zibal verification failed for trackId ${trackId}: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`,
      );

      await this.prisma.paymentAttempt
        .create({
          data: {
            invoiceId: invoice.id,
            amountToman: invoice.totalToman,
            provider: "ZIBAL",
            gatewayRef: String(trackId),
            status: "FAILED",
            errorCode: verifyError instanceof PaymentGatewayError ? String(verifyError.code) : "VERIFY_FAILED",
            errorMessage: verifyError instanceof Error ? verifyError.message : "Verification failed",
            attemptedAt: new Date(),
          },
        })
        .catch(() => {});

      res.status(302).redirect(cleanFailedRedirect);
      return;
    }

    this.logger.log(
      `Zibal verification succeeded: amount ${verifyResult.amountToman} Toman, refNumber: ${verifyResult.refNumber}, alreadyVerified: ${verifyResult.isAlreadyVerified}`,
    );

    // 3. Amount Validation (CRITICAL)
    if (verifyResult.amountToman !== invoice.totalToman) {
      this.logger.error(
        `SECURITY ALERT: Payment amount mismatch for invoice ${invoice.invoiceNumber}! Expected ${invoice.totalToman} Toman, but Zibal verified ${verifyResult.amountToman} Toman`,
      );

      await this.prisma.paymentAttempt
        .create({
          data: {
            invoiceId: invoice.id,
            amountToman: verifyResult.amountToman,
            provider: "ZIBAL",
            gatewayRef: String(verifyResult.refNumber || trackId),
            status: "FAILED",
            errorCode: "AMOUNT_MISMATCH",
            errorMessage: `Amount mismatch: expected ${invoice.totalToman}, received ${verifyResult.amountToman}`,
            attemptedAt: new Date(),
          },
        })
        .catch(() => {});

      await this.prisma.auditLog
        .create({
          data: {
            actorType: "SYSTEM",
            action: "payment.amount_mismatch_detected",
            entityType: "Invoice",
            entityId: invoice.id,
            reason: `مغایرت مبلغ پرداختی با مبلغ فاکتور: فاکتور ${invoice.totalToman} تومان، دریافتی ${verifyResult.amountToman} تومان`,
            after: {
              invoiceId: invoice.id,
              expectedAmountToman: invoice.totalToman,
              verifiedAmountToman: verifyResult.amountToman,
              trackId,
              refNumber: verifyResult.refNumber,
            },
          },
        })
        .catch(() => {});

      res.status(302).redirect(cleanFailedRedirect);
      return;
    }

    // 4. Idempotency Check: if invoice already paid or payment already exists
    if (invoice.status === "PAID" || invoice.payment) {
      this.logger.log(
        `Invoice ${invoice.invoiceNumber} is already paid. Returning idempotent success for trackId ${trackId}`,
      );

      res.status(302).redirect(cleanSuccessRedirect);
      return;
    }

    // 5. Atomic database transaction to mark payment as PAID and reactivate services
    const now = verifyResult.paidAt ? new Date(verifyResult.paidAt) : new Date();
    const finalGatewayRef = String(verifyResult.refNumber || trackId);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Double check inside transaction
        const freshInvoice = await tx.invoice.findUnique({
          where: { id: invoice.id },
          include: { customer: true, items: true, payment: true },
        });

        if (freshInvoice?.status === "PAID" || freshInvoice?.payment) {
          return;
        }

        // Create Payment record
        const payment = await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amountToman: invoice.totalToman,
            provider: "ZIBAL",
            gatewayRef: finalGatewayRef,
            paidAt: now,
          },
        });

        // Update Invoice status to PAID
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
            paidAt: now,
          },
        });

        // Reactivate suspended services linked to this invoice
        if (freshInvoice?.items && freshInvoice.items.length > 0) {
          for (const item of freshInvoice.items) {
            if (item.serviceId) {
              const svc = await tx.service.findUnique({
                where: { id: item.serviceId },
              });
              if (svc && svc.status !== "ACTIVE") {
                await tx.service.update({
                  where: { id: svc.id },
                  data: { status: "ACTIVE" },
                });

                await tx.auditLog
                  .create({
                    data: {
                      actorType: "SYSTEM",
                      actorRole: "CUSTOMER",
                      userId: freshInvoice.customerId || undefined,
                      action: "service.reactivated_by_payment",
                      entityType: "Service",
                      entityId: svc.id,
                      reason: `سرویس ${svc.name} پس از پرداخت موفق فاکتور ${freshInvoice.invoiceNumber} از طریق درگاه زیبال فعال شد`,
                      after: {
                        serviceId: svc.id,
                        status: "ACTIVE",
                        invoiceNumber: freshInvoice.invoiceNumber,
                      },
                    },
                  })
                  .catch(() => {});
              }
            }
          }
        }

        const customerName =
          freshInvoice?.customer?.displayName ||
          freshInvoice?.customer?.name ||
          "مشتری";

        // Audit log for successful Zibal payment
        await tx.auditLog
          .create({
            data: {
              actorType: "SYSTEM",
              actorRole: "CUSTOMER",
              actorDisplayNameSnapshot: customerName,
              userId: freshInvoice?.customer?.userId || freshInvoice?.customerId || undefined,
              action: "payment.zibal_verified",
              entityType: "Payment",
              entityId: payment.id,
              reason: `پرداخت آنلاین فاکتور ${freshInvoice?.invoiceNumber} به مبلغ ${payment.amountToman.toLocaleString(
                "fa-IR",
              )} تومان با موفقیت از طریق درگاه زیبال تایید و تسویه شد (کد مرجع: ${finalGatewayRef})`,
              after: {
                invoiceId: invoice.id,
                invoiceNumber: freshInvoice?.invoiceNumber,
                amountToman: payment.amountToman,
                gatewayRef: finalGatewayRef,
                provider: "ZIBAL",
                trackId,
                cardNumber: verifyResult.cardNumber,
                paidAt: now.toISOString(),
              },
            },
          })
          .catch(() => {});
      });

      this.logger.log(
        `Payment marked as paid and invoice ${invoice.invoiceNumber} marked as paid (refNumber: ${finalGatewayRef})`,
      );

      res.status(302).redirect(cleanSuccessRedirect);
      return;
    } catch (txError) {
      this.logger.error(
        `Transaction failed while marking payment for invoice ${invoice.invoiceNumber}: ${txError instanceof Error ? txError.message : String(txError)}`,
      );

      res.status(302).redirect(cleanFailedRedirect);
      return;
    }
  }

  private async findInvoiceForCallback(orderId?: string, trackId?: number) {
    if (orderId) {
      const inv = await this.prisma.invoice.findUnique({
        where: { id: orderId },
        include: { customer: true, items: true, payment: true },
      });
      if (inv) return inv;
    }

    if (trackId) {
      const attempt = await this.prisma.paymentAttempt.findFirst({
        where: { gatewayRef: String(trackId) },
        orderBy: { createdAt: "desc" },
      });
      if (attempt?.invoiceId) {
        return this.prisma.invoice.findUnique({
          where: { id: attempt.invoiceId },
          include: { customer: true, items: true, payment: true },
        });
      }
    }

    return null;
  }
}


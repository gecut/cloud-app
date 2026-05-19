import prisma from "@gecut-cloud/db";

import { assertAmountMatches } from "../utils/money";
import { AppError, assertOrThrow } from "../utils/errors";

export async function simulatePaymentCallback(input: {
  invoiceId: string;
  provider: string;
  gatewayRef: string;
  amountToman: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
      include: {
        payment: true,
      },
    });

    assertOrThrow(invoice, "RESOURCE_NOT_FOUND", "Invoice not found", "فاکتور موردنظر یافت نشد");

    if (input.success) {
      assertAmountMatches(invoice.totalToman, input.amountToman);

      if (invoice.status === "CANCELLED") {
        await tx.auditLog.create({
          data: {
            actorType: "SYSTEM",
            actorDisplayNameSnapshot: "شبیه‌ساز کال‌بک پرداخت",
            action: "payment.callback.ignored",
            entityType: "Invoice",
            entityId: invoice.id,
            reason: "invoice_cancelled",
            metadata: {
              provider: input.provider,
              gatewayRef: input.gatewayRef,
            },
          },
        });

        throw new AppError(
          "PAYMENT_CALLBACK_IGNORED",
          "Payment callback ignored because invoice is cancelled",
          "کال‌بک پرداخت برای فاکتور لغوشده نادیده گرفته شد",
        );
      }

      if (invoice.status === "PAID" || invoice.payment) {
        await tx.auditLog.create({
          data: {
            actorType: "SYSTEM",
            actorDisplayNameSnapshot: "شبیه‌ساز کال‌بک پرداخت",
            action: "payment.callback.duplicate",
            entityType: "Invoice",
            entityId: invoice.id,
            reason: "invoice_already_paid",
            metadata: {
              provider: input.provider,
              gatewayRef: input.gatewayRef,
            },
          },
        });

        throw new AppError(
          "PAYMENT_DUPLICATE_CALLBACK",
          "Duplicate successful callback for paid invoice",
          "برای این فاکتور قبلاً پرداخت موفق ثبت شده است",
        );
      }

      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          provider: input.provider,
          gatewayRef: input.gatewayRef,
          amountToman: input.amountToman,
          paidAt: new Date(),
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paidAt: payment.paidAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorType: "SYSTEM",
          actorDisplayNameSnapshot: "شبیه‌ساز کال‌بک پرداخت",
          action: "payment.callback.success",
          entityType: "Payment",
          entityId: payment.id,
          after: {
            invoiceId: invoice.id,
            amountToman: payment.amountToman,
          },
        },
      });

      return {
        success: true,
        payment,
        invoice: updatedInvoice,
      };
    }

    const attempt = await tx.paymentAttempt.create({
      data: {
        invoiceId: invoice.id,
        amountToman: input.amountToman,
        provider: input.provider,
        gatewayRef: input.gatewayRef,
        status: "FAILED",
        errorCode: input.errorCode ?? "SIMULATED_FAILURE",
        errorMessage: input.errorMessage ?? "Simulated payment callback failure",
        attemptedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorType: "SYSTEM",
        actorDisplayNameSnapshot: "شبیه‌ساز کال‌بک پرداخت",
        action: "payment.callback.failed",
        entityType: "PaymentAttempt",
        entityId: attempt.id,
        after: {
          invoiceId: invoice.id,
          status: attempt.status,
        },
      },
    });

    return {
      success: false,
      attempt,
    };
  });
}

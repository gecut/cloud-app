import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { RecordPaymentCommand } from "./record-payment.command";

@CommandHandler(RecordPaymentCommand)
export class RecordPaymentHandler
  implements ICommandHandler<RecordPaymentCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RecordPaymentCommand) {
    const { dto } = command;

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: dto.invoiceId },
        include: { customer: true, items: true },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);
      }

      if (invoice.status === "PAID") {
        throw new BadRequestException("Invoice is already paid");
      }

      if (invoice.status === "CANCELLED") {
        throw new BadRequestException("Cannot pay a cancelled invoice");
      }

      if (dto.amountToman !== invoice.totalToman) {
        throw new BadRequestException(
          `Payment amount (${dto.amountToman}) must exactly match invoice total (${invoice.totalToman})`,
        );
      }

      const now = new Date();

      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amountToman: dto.amountToman,
          provider: dto.provider,
          gatewayRef: dto.gatewayRef,
          paidAt: now,
        },
      });

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          status: "PAID",
          paidAt: now,
        },
      });

      const customer =
        (invoice as any).customer ||
        (invoice.customerId
          ? await tx.customer.findFirst({
              where: {
                OR: [{ id: invoice.customerId }, { userId: invoice.customerId }],
              },
            })
          : null);
      const customerName = customer?.displayName || customer?.name || "مشتری";

      await tx.auditLog
        .create({
          data: {
            actorType: "USER",
            actorRole: "CUSTOMER",
            actorDisplayNameSnapshot: customerName,
            userId: customer?.userId || customer?.id,
            action: "payment.record",
            entityType: "Payment",
            entityId: payment.id,
            reason: `پرداخت آنلاین فاکتور ${invoice.invoiceNumber} به مبلغ ${payment.amountToman.toLocaleString("fa-IR")} تومان توسط ${customerName} (کد پیگیری: ${dto.gatewayRef})`,
            after: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              customerName,
              customerId: invoice.customerId,
              amountToman: payment.amountToman,
              gatewayRef: dto.gatewayRef,
              provider: dto.provider,
              paidAt: now.toISOString(),
            },
          },
        })
        .catch(() => {});

      return payment;
    });
  }
}

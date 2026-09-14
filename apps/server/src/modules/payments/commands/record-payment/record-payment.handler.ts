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

      return payment;
    });
  }
}

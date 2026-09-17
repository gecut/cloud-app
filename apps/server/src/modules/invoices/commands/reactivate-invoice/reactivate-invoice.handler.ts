import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { ReactivateInvoiceCommand } from "./reactivate-invoice.command";

@CommandHandler(ReactivateInvoiceCommand)
export class ReactivateInvoiceHandler
  implements ICommandHandler<ReactivateInvoiceCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: ReactivateInvoiceCommand) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: command.invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${command.invoiceId} not found`);
    }

    if (invoice.status !== "CANCELLED") {
      throw new BadRequestException("تنها فاکتورهای لغو شده امکان فعال‌سازی مجدد را دارند");
    }

    const updated = await this.prisma.invoice.update({
      where: { id: command.invoiceId },
      data: {
        status: "UNPAID",
        cancelledAt: null,
      },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorType: "USER",
          actorRole: "ADMIN",
          actorDisplayNameSnapshot: "مدیر مالی سیستم",
          action: "invoice.reactivate",
          entityType: "Invoice",
          entityId: invoice.id,
          reason: `فعال‌سازی مجدد فاکتور ${invoice.invoiceNumber}`,
          before: { status: "CANCELLED" },
          after: { status: "UNPAID" },
        },
      })
      .catch(() => {});

    return updated;
  }
}

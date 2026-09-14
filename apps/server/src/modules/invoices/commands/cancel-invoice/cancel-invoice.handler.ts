import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { CancelInvoiceCommand } from "./cancel-invoice.command";

@CommandHandler(CancelInvoiceCommand)
export class CancelInvoiceHandler
  implements ICommandHandler<CancelInvoiceCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CancelInvoiceCommand) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: command.invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${command.invoiceId} not found`);
    }

    if (invoice.status === "PAID") {
      throw new BadRequestException("Cannot cancel a paid invoice");
    }

    return this.prisma.invoice.update({
      where: { id: command.invoiceId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        notes: command.reason
          ? `${invoice.notes ? `${invoice.notes} | ` : ""}Cancelled: ${command.reason}`
          : invoice.notes,
      },
    });
  }
}

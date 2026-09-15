import { NotFoundException } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { UpdateInvoiceCommand } from "./update-invoice.command";

@CommandHandler(UpdateInvoiceCommand)
export class UpdateInvoiceHandler
  implements ICommandHandler<UpdateInvoiceCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateInvoiceCommand) {
    const { invoiceId, dto } = command;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, customer: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === "PAID" && !invoice.paidAt) {
        updateData.paidAt = new Date();
      } else if (dto.status === "CANCELLED" && !invoice.cancelledAt) {
        updateData.cancelledAt = new Date();
      } else if (dto.status === "UNPAID") {
        updateData.paidAt = null;
        updateData.cancelledAt = null;
      }
    }

    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    if (dto.items && dto.items.length > 0) {
      const processedItems = dto.items.map((item, idx) => {
        const unitPrice = item.unitPriceToman ?? item.amountToman ?? 0;
        const totalToman = item.totalToman ?? (item.quantity || 1) * unitPrice;

        return {
          id: `item_${Date.now()}_${idx}`,
          invoiceId,
          serviceId: item.serviceId || null,
          title: item.title,
          description: item.description || null,
          quantity: item.quantity || 1,
          unitPriceToman: unitPrice,
          totalToman,
        };
      });

      const subtotalToman = processedItems.reduce(
        (sum, item) => sum + item.totalToman,
        0,
      );

      updateData.items = processedItems;
      updateData.subtotalToman = subtotalToman;
      updateData.totalToman = subtotalToman;
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    // Record audit log
    await this.prisma.auditLog
      .create({
        data: {
          actorType: "USER",
          actorRole: "ADMIN",
          actorDisplayNameSnapshot: "مدیر مالی سیستم",
          action: "invoice.update",
          entityType: "Invoice",
          entityId: invoice.id,
          reason: `ویرایش فاکتور ${invoice.invoiceNumber} به مبلغ ${(updated.totalToman || invoice.totalToman).toLocaleString("fa-IR")} تومان`,
          before: { totalToman: invoice.totalToman, dueDate: invoice.dueDate },
          after: { totalToman: updated.totalToman, dueDate: updated.dueDate },
        },
      })
      .catch(() => {});

    return updated;
  }
}

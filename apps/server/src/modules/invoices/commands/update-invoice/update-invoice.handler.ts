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
      if (dto.status === "PAID" && invoice.status !== "PAID") {
        const now = new Date();
        updateData.paidAt = now;
        const existingPayment = await this.prisma.payment.findFirst({
          where: { invoiceId },
        });
        if (!existingPayment) {
          const paymentAmount = updateData.totalToman ?? invoice.totalToman;
          const newPayment = await this.prisma.payment.create({
            data: {
              invoiceId,
              amountToman: paymentAmount,
              provider: "MANUAL_TRANSFER",
              gatewayRef: `ADMIN-CONFIRMED-${Date.now().toString().slice(-6)}`,
              paidAt: now,
            },
          });
          const customerName =
            invoice.customer?.displayName || invoice.customer?.name || "مشتری";
          await this.prisma.auditLog
            .create({
              data: {
                actorType: "USER",
                actorRole: "ADMIN",
                actorDisplayNameSnapshot: "مدیر مالی سیستم",
                action: "payment.record",
                entityType: "Payment",
                entityId: newPayment.id,
                reason: `تایید و تسویه دستی فاکتور ${invoice.invoiceNumber} به مبلغ ${paymentAmount.toLocaleString("fa-IR")} تومان توسط مدیر سیستم برای ${customerName}`,
                after: {
                  invoiceId: invoice.id,
                  invoiceNumber: invoice.invoiceNumber,
                  amountToman: paymentAmount,
                  confirmedBy: "ADMIN",
                  provider: "MANUAL_TRANSFER",
                },
              },
            })
            .catch(() => {});
        }
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
        const existingItem = invoice.items?.[idx];
        const serviceId =
          item.serviceId !== undefined
            ? item.serviceId
            : existingItem?.serviceId || null;

        return {
          id: existingItem?.id || `item_${Date.now()}_${idx}`,
          invoiceId,
          serviceId,
          title: item.title,
          description: item.description ?? existingItem?.description ?? null,
          quantity: item.quantity || 1,
          unitPriceToman: unitPrice,
          totalToman,
          serviceNameSnapshot: existingItem?.serviceNameSnapshot,
          serviceTypeSnapshot:
            (item as any).serviceTypeSnapshot ||
            existingItem?.serviceTypeSnapshot ||
            null,
          servicePriceSnapshotToman: existingItem?.servicePriceSnapshotToman,
          serviceRenewalDateSnapshot: existingItem?.serviceRenewalDateSnapshot,
        };
      });

      const subtotalToman = processedItems.reduce(
        (sum, item) => sum + item.totalToman,
        0,
      );

      updateData.subtotalToman = subtotalToman;
      updateData.totalToman = subtotalToman;

      await this.prisma.invoiceItem.deleteMany({ where: { invoiceId } });
      await this.prisma.invoiceItem.createMany({
        data: processedItems.map((it) => ({
          id: it.id,
          invoiceId,
          serviceId: it.serviceId,
          title: it.title,
          description: it.description,
          quantity: it.quantity,
          unitPriceToman: it.unitPriceToman,
          totalToman: it.totalToman,
          serviceNameSnapshot: it.serviceNameSnapshot,
          serviceTypeSnapshot: it.serviceTypeSnapshot,
          servicePriceSnapshotToman: it.servicePriceSnapshotToman,
          serviceRenewalDateSnapshot: it.serviceRenewalDateSnapshot,
        })),
      });

      updateData.items = processedItems;
    }

    // invoiceNumber is permanent, immutable, and must NEVER change on update
    delete (updateData as any).invoiceNumber;

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    // If the invoice is PAID and total amount changed, keep the payment record amount synchronized
    if (updated.status === "PAID" && updateData.totalToman !== undefined) {
      try {
        const payment = await this.prisma.payment.findFirst({
          where: { invoiceId },
        });
        if (payment && payment.amountToman !== updated.totalToman) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { amountToman: updated.totalToman },
          });
        }
      } catch {}
    }

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

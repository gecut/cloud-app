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

      // Reactivate linked services upon payment if inactive/suspended.
      // STRICT RULE: Payment must NEVER advance or modify renewalDate / purchaseDate / usedQuantity!
      if (invoice.items && invoice.items.length > 0) {
        for (const item of invoice.items) {
          if (item.serviceId) {
            const supService = this.prisma.memSupplierServices.get(item.serviceId);
            if (supService) {
              if (supService.status !== "ACTIVE") {
                supService.status = "ACTIVE";
                this.prisma.saveToDisk();
              }
            } else {
              const svc = await tx.service.findUnique({
                where: { id: item.serviceId },
              });
              if (svc && svc.status !== "ACTIVE") {
                await tx.service.update({
                  where: { id: svc.id },
                  data: {
                    status: "ACTIVE",
                  },
                });

                await tx.auditLog
                  .create({
                    data: {
                      actorType: "SYSTEM",
                      actorRole: "CUSTOMER",
                      actorDisplayNameSnapshot: customerName,
                      userId: customer?.userId || customer?.id,
                      action: "service.reactivated_by_payment",
                      entityType: "Service",
                      entityId: svc.id,
                      reason: `سرویس ${svc.name} پس از پرداخت موفق فاکتور ${invoice.invoiceNumber} فعال شد`,
                      after: {
                        serviceId: svc.id,
                        status: "ACTIVE",
                        invoiceNumber: invoice.invoiceNumber,
                      },
                    },
                  })
                  .catch(() => {});
              }
            }
          }
        }
      }

      const isSupplier = (invoice as any).counterpartyType === "SUPPLIER" || Boolean((invoice as any).supplierId);
      const supplier = isSupplier && (invoice as any).supplierId ? this.prisma.memSuppliers.get((invoice as any).supplierId) : null;

      if (isSupplier && supplier) {
        supplier.totalPayableToman = Math.max(0, (supplier.totalPayableToman || 0) - payment.amountToman);
        this.prisma.saveToDisk();
      }

      const isManual = isSupplier || dto.provider === "MANUAL_TRANSFER" || dto.provider === "CASH" || !dto.provider?.toLowerCase().includes("online");
      const actorName = isManual ? "مدیر مالی سیستم" : customerName;
      const paymentAction = isSupplier
        ? "supplier_payment.record"
        : isManual
        ? "payment.manual_record"
        : "payment.record";

      const paymentReason = isSupplier
        ? `ثبت سند تسویه/پرداخت فاکتور تامین‌کننده ${invoice.invoiceNumber} به مبلغ ${payment.amountToman.toLocaleString("fa-IR")} تومان به ${supplier?.name || "تامین‌کننده"} (کد پیگیری: ${dto.gatewayRef})`
        : isManual
        ? `پرداخت دستی فاکتور ${invoice.invoiceNumber} به مبلغ ${payment.amountToman.toLocaleString("fa-IR")} تومان توسط مدیر سیستم برای ${customerName} (کد پیگیری: ${dto.gatewayRef})`
        : `پرداخت آنلاین فاکتور ${invoice.invoiceNumber} به مبلغ ${payment.amountToman.toLocaleString("fa-IR")} تومان توسط ${customerName} (کد پیگیری: ${dto.gatewayRef})`;

      await tx.auditLog
        .create({
          data: {
            actorType: isManual ? "USER" : "CUSTOMER",
            actorRole: isManual ? "ADMIN" : "CUSTOMER",
            actorDisplayNameSnapshot: actorName,
            userId: customer?.userId || customer?.id,
            action: paymentAction,
            entityType: "Payment",
            entityId: payment.id,
            reason: paymentReason,
            after: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              customerName: isSupplier ? undefined : customerName,
              supplierName: isSupplier ? supplier?.name : undefined,
              customerId: invoice.customerId,
              supplierId: (invoice as any).supplierId,
              isSupplier,
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

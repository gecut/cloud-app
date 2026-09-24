import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { CreateInvoiceCommand } from "./create-invoice.command";
import { getNextUniqueInvoiceNumber } from "../../utils/invoice-number.util";

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler
  implements ICommandHandler<CreateInvoiceCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateInvoiceCommand) {
    const { dto } = command;

    return this.prisma.$transaction(async (tx) => {
      const isSupplier = dto.counterpartyType === "SUPPLIER" || Boolean(dto.supplierId);
      let supplierObj: any = null;
      if (isSupplier && dto.supplierId) {
        supplierObj = this.prisma.memSuppliers.get(dto.supplierId) || null;
      }

      let effectiveCustomerId: string | null = null;
      if (dto.customerId) {
        const matchedCustomer = await tx.customer.findFirst({
          where: {
            OR: [{ id: dto.customerId }, { userId: dto.customerId }],
          },
        });
        effectiveCustomerId = matchedCustomer ? matchedCustomer.id : dto.customerId;
      }

      const invoiceNumber = await getNextUniqueInvoiceNumber(tx);

      const processedItems = await Promise.all(
        dto.items.map(async (item) => {
          let serviceSnapshot: {
            serviceNameSnapshot?: string;
            serviceTypeSnapshot?: string;
            servicePriceSnapshotToman?: number;
            serviceRenewalDateSnapshot?: Date;
          } = {};

          if (item.serviceId) {
            const supService = this.prisma.memSupplierServices.get(item.serviceId);
            if (supService) {
              serviceSnapshot = {
                serviceNameSnapshot: supService.name,
                serviceTypeSnapshot: supService.type || "سرویس تامین‌کننده",
                servicePriceSnapshotToman: supService.priceToman || supService.monthlyExpenseToman,
                serviceRenewalDateSnapshot: supService.renewalDate,
              };
            } else {
              const service = await tx.service.findUnique({
                where: { id: item.serviceId },
                include: { serviceType: true },
              });
              if (service) {
                serviceSnapshot = {
                  serviceNameSnapshot: service.name,
                  serviceTypeSnapshot: service.serviceType?.name || service.serviceType?.slug || undefined,
                  servicePriceSnapshotToman: service.priceToman,
                  serviceRenewalDateSnapshot: service.renewalDate,
                };
              }
            }
          }

          const unitPrice = item.unitPriceToman ?? item.amountToman ?? 0;
          const totalToman = item.totalToman ?? item.quantity * unitPrice;

          return {
            serviceId: item.serviceId || null,
            title: item.title,
            description: item.description || null,
            quantity: item.quantity,
            unitPriceToman: unitPrice,
            totalToman,
            serviceTypeSnapshot: (item as any).serviceTypeSnapshot || serviceSnapshot.serviceTypeSnapshot || null,
            ...serviceSnapshot,
          };
        }),
      );

      const subtotalToman = processedItems.reduce(
        (sum, item) => sum + item.totalToman,
        0,
      );
      const totalToman = subtotalToman;

      const invoice = await tx.invoice.create({
        data: {
          customerId: effectiveCustomerId,
          supplierId: dto.supplierId || null,
          counterpartyType: isSupplier ? "SUPPLIER" : "CUSTOMER",
          invoiceNumber,
          status: "UNPAID",
          subtotalToman,
          totalToman,
          dueDate: new Date(dto.dueDate),
          notes: dto.notes || null,
          items: {
            create: processedItems,
          },
        } as any,
        include: {
          items: true,
          customer: true,
        },
      });

      // Update supplier liability if it's a supplier invoice
      if (isSupplier && supplierObj) {
        supplierObj.totalPayableToman = (supplierObj.totalPayableToman || 0) + totalToman;
        this.prisma.saveToDisk();
      }

      const counterpartyName = isSupplier
        ? (supplierObj?.name || "تامین‌کننده")
        : (invoice.customer?.name || "مشتری");

      await tx.auditLog
        .create({
          data: {
            actorType: "USER",
            actorRole: "ADMIN",
            actorDisplayNameSnapshot: "مدیر مالی سیستم",
            action: isSupplier ? "supplier_invoice.create" : "invoice.create",
            entityType: "Invoice",
            entityId: invoice.id,
            reason: `صدور فاکتور ${isSupplier ? "تامین‌کننده " : ""}${invoiceNumber} به مبلغ ${totalToman.toLocaleString("fa-IR")} تومان برای ${counterpartyName}`,
            after: {
              invoiceNumber,
              totalToman,
              customerId: dto.customerId,
              supplierId: dto.supplierId,
              counterpartyType: isSupplier ? "SUPPLIER" : "CUSTOMER",
            },
          },
        })
        .catch(() => {});

      return invoice;
    });
  }
}

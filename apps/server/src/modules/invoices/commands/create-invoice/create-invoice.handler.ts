import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { CreateInvoiceCommand } from "./create-invoice.command";

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler
  implements ICommandHandler<CreateInvoiceCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateInvoiceCommand) {
    const { dto } = command;

    return this.prisma.$transaction(async (tx) => {
      let effectiveCustomerId = dto.customerId;
      const matchedCustomer = await tx.customer.findFirst({
        where: {
          OR: [{ id: dto.customerId }, { userId: dto.customerId }],
        },
      });
      if (matchedCustomer) {
        effectiveCustomerId = matchedCustomer.id;
      }

      const year = new Date().getFullYear();
      const seq = await tx.invoiceSequence.upsert({
        where: { year },
        create: { year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });

      const invoiceNumber = `INV-${year}-${seq.lastNumber.toString().padStart(5, "0")}`;

      const processedItems = await Promise.all(
        dto.items.map(async (item) => {
          let serviceSnapshot: {
            serviceNameSnapshot?: string;
            serviceTypeSnapshot?: string;
            servicePriceSnapshotToman?: number;
            serviceRenewalDateSnapshot?: Date;
          } = {};

          if (item.serviceId) {
            const service = await tx.service.findUnique({
              where: { id: item.serviceId },
              include: { serviceType: true },
            });
            if (service) {
              serviceSnapshot = {
                serviceNameSnapshot: service.name,
                serviceTypeSnapshot: service.serviceType?.name,
                servicePriceSnapshotToman: service.priceToman,
                serviceRenewalDateSnapshot: service.renewalDate,
              };
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
          invoiceNumber,
          status: "UNPAID",
          subtotalToman,
          totalToman,
          dueDate: new Date(dto.dueDate),
          notes: dto.notes || null,
          items: {
            create: processedItems,
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      await tx.auditLog
        .create({
          data: {
            actorType: "USER",
            actorRole: "ADMIN",
            actorDisplayNameSnapshot: "مدیر مالی سیستم",
            action: "invoice.create",
            entityType: "Invoice",
            entityId: invoice.id,
            reason: `صدور فاکتور ${invoiceNumber} به مبلغ ${totalToman.toLocaleString("fa-IR")} تومان برای ${invoice.customer?.name || "مشتری"}`,
            after: { invoiceNumber, totalToman, customerId: dto.customerId },
          },
        })
        .catch(() => {});

      return invoice;
    });
  }
}

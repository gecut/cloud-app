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

          const totalToman = item.quantity * item.unitPriceToman;

          return {
            serviceId: item.serviceId || null,
            title: item.title,
            description: item.description || null,
            quantity: item.quantity,
            unitPriceToman: item.unitPriceToman,
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
          customerId: dto.customerId,
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

      return invoice;
    });
  }
}

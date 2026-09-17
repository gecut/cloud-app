import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { ListInvoicesQuery } from "./list-invoices.query";

@QueryHandler(ListInvoicesQuery)
export class ListInvoicesHandler implements IQueryHandler<ListInvoicesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListInvoicesQuery) {
    const { customerId, status, page, limit } = query;
    const skip = (page - 1) * limit;

    let resolvedCustomerId = customerId;
    if (customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: {
          OR: [{ id: customerId }, { userId: customerId }],
        },
      });
      if (customer) {
        resolvedCustomerId = customer.id;
      }
    }

    const where: any = {};
    if (resolvedCustomerId) where.customerId = resolvedCustomerId;
    if (status) where.status = status;

    // Ensure all customer services with price > 0 have an associated invoice
    try {
      if (resolvedCustomerId) {
        const services = await this.prisma.service.findMany({
          where: { customerId: resolvedCustomerId },
        });

        for (const svc of services) {
          if (!svc.priceToman || svc.priceToman <= 0) continue;

          const existingItems = await this.prisma.invoiceItem.findMany({
            where: { serviceId: svc.id },
          });

          if (existingItems.length === 0) {
            const year = new Date().getFullYear();
            let invoiceNumber = (30001 + Math.floor(Math.random() * 89999)).toString();
            try {
              const seq = await this.prisma.invoiceSequence.upsert({
                where: { year },
                create: { year, lastNumber: 1 },
                update: { lastNumber: { increment: 1 } },
              });
              invoiceNumber = (30000 + seq.lastNumber).toString();
            } catch {}

            const svcQuantity = (svc as any).quantity;
            const isPackage = Boolean(svcQuantity && svcQuantity > 0);
            const pkgQty = svcQuantity || 1;
            const itemTitle = isPackage
              ? `${svc.name} (${pkgQty.toLocaleString("fa-IR")} عدد در بسته)`
              : `صورت‌حساب سرویس ${svc.name}`;

            await this.prisma.invoice.create({
              data: {
                customerId: svc.customerId || resolvedCustomerId,
                invoiceNumber,
                status: "UNPAID",
                subtotalToman: svc.priceToman,
                totalToman: svc.priceToman,
                dueDate: svc.renewalDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                notes: `صورت‌حساب سرویس ${svc.name}`,
                items: {
                  create: [
                    {
                      serviceId: svc.id,
                      title: itemTitle,
                      description: svc.description || `سرویس فعال ${svc.name}`,
                      quantity: pkgQty,
                      unitPriceToman: svc.priceToman,
                      totalToman: svc.priceToman,
                      serviceNameSnapshot: svc.name,
                      servicePriceSnapshotToman: svc.priceToman,
                    },
                  ],
                },
              },
            });
          }
        }
      }
    } catch {
      // ignore
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          items: true,
          _count: {
            select: { items: true },
          },
          payment: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

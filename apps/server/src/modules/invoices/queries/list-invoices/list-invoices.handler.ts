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


    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          items: {
            include: {
              service: {
                include: {
                  serviceType: true,
                },
              },
            },
          },
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

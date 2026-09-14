import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { ListInvoicesQuery } from "./list-invoices.query";

@QueryHandler(ListInvoicesQuery)
export class ListInvoicesHandler implements IQueryHandler<ListInvoicesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListInvoicesQuery) {
    const { customerId, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
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

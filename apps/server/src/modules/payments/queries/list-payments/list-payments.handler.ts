import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { ListPaymentsQuery } from "./list-payments.query";

@QueryHandler(ListPaymentsQuery)
export class ListPaymentsHandler implements IQueryHandler<ListPaymentsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListPaymentsQuery) {
    const { page, limit, customerId } = query;
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
    if (resolvedCustomerId) {
      where.invoice = { customerId: resolvedCustomerId };
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paidAt: "desc" },
        include: {
          invoice: {
            include: {
              customer: true,
              items: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
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

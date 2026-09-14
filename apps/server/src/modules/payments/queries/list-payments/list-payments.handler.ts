import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { ListPaymentsQuery } from "./list-payments.query";

@QueryHandler(ListPaymentsQuery)
export class ListPaymentsHandler implements IQueryHandler<ListPaymentsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListPaymentsQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { paidAt: "desc" },
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
        },
      }),
      this.prisma.payment.count(),
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

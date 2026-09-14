import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { ListCustomersQuery } from "./list-customers.query";

@QueryHandler(ListCustomersQuery)
export class ListCustomersHandler implements IQueryHandler<ListCustomersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListCustomersQuery) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { services: true, invoices: true },
          },
        },
      }),
      this.prisma.customer.count({ where }),
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

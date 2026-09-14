import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { ListServersQuery } from "./list-servers.query";

@QueryHandler(ListServersQuery)
export class ListServersHandler implements IQueryHandler<ListServersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListServersQuery) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: any = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.server.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { services: true },
          },
        },
      }),
      this.prisma.server.count({ where }),
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

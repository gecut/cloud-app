import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { ListServicesQuery } from "./list-services.query";

@QueryHandler(ListServicesQuery)
export class ListServicesHandler implements IQueryHandler<ListServicesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListServicesQuery) {
    const { customerId, page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (customerId) {
      // Support finding by either customerId or userId
      const matchedCustomer = await this.prisma.customer.findFirst({
        where: {
          OR: [{ id: customerId }, { userId: customerId }],
        },
      });

      if (matchedCustomer) {
        where.customerId = matchedCustomer.id;
      } else {
        where.customerId = customerId;
      }
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          serviceType: true,
          serviceGroup: true,
          server: true,
          endpoints: true,
          parentService: true,
          childServices: {
            include: { customer: true, endpoints: true },
          },
        },
      }),
      this.prisma.service.count({ where }),
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

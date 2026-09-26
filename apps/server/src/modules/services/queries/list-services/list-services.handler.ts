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
      if (customerId === "__NO_CUSTOMER_SERVICES__") {
        where.customerId = "__NO_CUSTOMER_SERVICES__";
      } else {
        // Support finding by either customerId, userId, or matching phone
        let matchedCustomer = await this.prisma.customer.findFirst({
          where: {
            OR: [{ id: customerId }, { userId: customerId }],
          },
        });

        if (!matchedCustomer) {
          const u = await this.prisma.user.findUnique({ where: { id: customerId } });
          if (u?.phone) {
            matchedCustomer = await this.prisma.customer.findFirst({
              where: { phone: u.phone },
            });
          }
        }

        if (matchedCustomer) {
          where.OR = [
            { customerId: matchedCustomer.id },
            ...(matchedCustomer.userId ? [{ customerId: matchedCustomer.userId }] : []),
          ];
        } else {
          where.customerId = customerId;
        }
        // When querying for a customer, exclude parent organizational services
        where.childServices = { none: {} };
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

    const finalItems = customerId
      ? items.filter((s: any) => (!s.childServices || s.childServices.length === 0) && Boolean(s.customerId))
      : items;
    const finalTotal = customerId && filteredItemsCount(items, finalItems) ? finalItems.length : total;

    return {
      items: finalItems,
      total: finalTotal,
      page,
      limit,
      totalPages: Math.ceil(finalTotal / limit) || 1,
    };
  }
}

function filteredItemsCount(original: any[], filtered: any[]) {
  return original.length !== filtered.length;
}

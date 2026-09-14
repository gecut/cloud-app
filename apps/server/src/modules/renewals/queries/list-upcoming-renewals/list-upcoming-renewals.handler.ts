import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { ListUpcomingRenewalsQuery } from "./list-upcoming-renewals.query";

@QueryHandler(ListUpcomingRenewalsQuery)
export class ListUpcomingRenewalsHandler
  implements IQueryHandler<ListUpcomingRenewalsQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListUpcomingRenewalsQuery) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + query.daysAhead);

    return this.prisma.service.findMany({
      where: {
        status: "ACTIVE",
        renewalDate: {
          lte: targetDate,
        },
      },
      include: {
        customer: true,
        serviceType: true,
      },
      orderBy: {
        renewalDate: "asc",
      },
    });
  }
}

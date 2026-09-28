import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { RenewalsSchedulerService } from "../../../renewals/renewals-scheduler.service";
import { GetCustomerQuery } from "./get-customer.query";

@QueryHandler(GetCustomerQuery)
export class GetCustomerHandler implements IQueryHandler<GetCustomerQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renewalsScheduler: RenewalsSchedulerService,
  ) {}

  async execute(query: GetCustomerQuery) {
    // Proactively auto-renew any services that have autoRenew: true and are expired or depleted
    await this.renewalsScheduler.checkAndProcessExpiredServices().catch(() => {});

    const customer = await this.prisma.customer.findFirst({
      where: {
        OR: [{ id: query.id }, { userId: query.id }],
      },
      include: {
        user: true,
        services: {
          include: {
            serviceType: true,
            parentService: {
              include: {
                serviceType: true,
              },
            },
            server: true,
            endpoints: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        serviceGroups: true,
        invoices: {
          include: {
            payment: true,
            paymentAttempts: true,
            items: {
              include: {
                service: {
                  include: {
                    serviceType: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${query.id} not found`);
    }

    return customer;
  }
}

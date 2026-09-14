import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { GetCustomerQuery } from "./get-customer.query";

@QueryHandler(GetCustomerQuery)
export class GetCustomerHandler implements IQueryHandler<GetCustomerQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCustomerQuery) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: query.id },
      include: {
        user: true,
        services: {
          include: {
            serviceType: true,
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
            items: true,
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

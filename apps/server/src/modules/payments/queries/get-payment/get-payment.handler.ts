import { NotFoundException } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { GetPaymentQuery } from "./get-payment.query";

@QueryHandler(GetPaymentQuery)
export class GetPaymentHandler implements IQueryHandler<GetPaymentQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPaymentQuery) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: query.id },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${query.id} not found`);
    }

    return payment;
  }
}

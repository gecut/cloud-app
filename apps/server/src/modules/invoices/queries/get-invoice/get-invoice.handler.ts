import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { GetInvoiceQuery } from "./get-invoice.query";

@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler<GetInvoiceQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetInvoiceQuery) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: query.id },
      include: {
        customer: true,
        items: {
          include: {
            service: {
              include: {
                serviceType: true,
              },
            },
          },
        },
        payment: true,
        paymentAttempts: {
          orderBy: { attemptedAt: "desc" },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${query.id} not found`);
    }

    return invoice;
  }
}

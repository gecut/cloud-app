import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { GetServiceQuery } from "./get-service.query";

@QueryHandler(GetServiceQuery)
export class GetServiceHandler implements IQueryHandler<GetServiceQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetServiceQuery) {
    const service = await this.prisma.service.findUnique({
      where: { id: query.id },
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
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${query.id} not found`);
    }

    return service;
  }
}

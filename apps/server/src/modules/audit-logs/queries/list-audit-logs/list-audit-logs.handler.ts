import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { ListAuditLogsQuery } from "./list-audit-logs.query";

@QueryHandler(ListAuditLogsQuery)
export class ListAuditLogsHandler implements IQueryHandler<ListAuditLogsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListAuditLogsQuery): Promise<any> {
    const { entityType, entityId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.auditLog.count({ where }),
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

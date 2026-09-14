import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { RecordAuditLogCommand } from "./record-audit-log.command";

@CommandHandler(RecordAuditLogCommand)
export class RecordAuditLogHandler
  implements ICommandHandler<RecordAuditLogCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RecordAuditLogCommand): Promise<any> {
    const { dto } = command;

    return this.prisma.auditLog.create({
      data: {
        actorType: dto.actorType,
        userId: dto.userId || null,
        actorRole: dto.actorRole || null,
        actorDisplayNameSnapshot: dto.actorDisplayNameSnapshot || null,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        before: dto.before ? JSON.stringify(dto.before) : undefined,
        after: dto.after ? JSON.stringify(dto.after) : undefined,
        reason: dto.reason || null,
      },
    });
  }
}

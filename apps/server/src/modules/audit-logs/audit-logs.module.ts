import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { AuditLogsController } from "./audit-logs.controller";
import { RecordAuditLogHandler } from "./commands/record-audit-log/record-audit-log.handler";
import { ListAuditLogsHandler } from "./queries/list-audit-logs/list-audit-logs.handler";

const CommandHandlers = [RecordAuditLogHandler];
const QueryHandlers = [ListAuditLogsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [AuditLogsController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class AuditLogsModule {}

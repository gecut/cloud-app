import { RecordAuditLogDto } from "./record-audit-log.dto";

export class RecordAuditLogCommand {
  constructor(public readonly dto: RecordAuditLogDto) {}
}

export class ListAuditLogsQuery {
  constructor(
    public readonly entityType?: string,
    public readonly entityId?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}

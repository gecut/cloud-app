export class ListInvoicesQuery {
  constructor(
    public readonly customerId?: string,
    public readonly status?: "UNPAID" | "PAID" | "CANCELLED",
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}

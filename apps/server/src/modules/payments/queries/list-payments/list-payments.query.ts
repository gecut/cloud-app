export class ListPaymentsQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly customerId?: string,
  ) {}
}

export class CancelInvoiceCommand {
  constructor(
    public readonly invoiceId: string,
    public readonly reason?: string,
  ) {}
}

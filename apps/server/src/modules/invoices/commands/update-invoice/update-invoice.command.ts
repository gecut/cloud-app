import { UpdateInvoiceDto } from "./update-invoice.dto";

export class UpdateInvoiceCommand {
  constructor(
    public readonly invoiceId: string,
    public readonly dto: UpdateInvoiceDto,
  ) {}
}

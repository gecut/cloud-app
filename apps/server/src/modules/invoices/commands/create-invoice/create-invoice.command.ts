import { CreateInvoiceDto } from "./create-invoice.dto";

export class CreateInvoiceCommand {
  constructor(public readonly dto: CreateInvoiceDto) {}
}

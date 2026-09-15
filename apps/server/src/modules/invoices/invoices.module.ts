import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CancelInvoiceHandler } from "./commands/cancel-invoice/cancel-invoice.handler";
import { CreateInvoiceHandler } from "./commands/create-invoice/create-invoice.handler";
import { UpdateInvoiceHandler } from "./commands/update-invoice/update-invoice.handler";
import { InvoicesController } from "./invoices.controller";
import { GetInvoiceHandler } from "./queries/get-invoice/get-invoice.handler";
import { ListInvoicesHandler } from "./queries/list-invoices/list-invoices.handler";

const CommandHandlers = [CreateInvoiceHandler, CancelInvoiceHandler, UpdateInvoiceHandler];
const QueryHandlers = [GetInvoiceHandler, ListInvoicesHandler];

@Module({
  imports: [CqrsModule],
  controllers: [InvoicesController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class InvoicesModule {}

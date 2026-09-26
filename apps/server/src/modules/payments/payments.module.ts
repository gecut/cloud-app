import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RecordPaymentHandler } from "./commands/record-payment/record-payment.handler";
import { PaymentsController } from "./payments.controller";
import { GetPaymentHandler } from "./queries/get-payment/get-payment.handler";
import { ListPaymentsHandler } from "./queries/list-payments/list-payments.handler";

import { ZibalService } from "./services/zibal.service";

const CommandHandlers = [RecordPaymentHandler];
const QueryHandlers = [GetPaymentHandler, ListPaymentsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [PaymentsController],
  providers: [...CommandHandlers, ...QueryHandlers, ZibalService],
  exports: [...CommandHandlers, ...QueryHandlers, ZibalService],
})
export class PaymentsModule {}

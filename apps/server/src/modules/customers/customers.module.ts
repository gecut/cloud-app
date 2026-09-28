import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RenewalsModule } from "../renewals/renewals.module";
import { CreateCustomerHandler } from "./commands/create-customer/create-customer.handler";
import { UpdateCustomerHandler } from "./commands/update-customer/update-customer.handler";
import { CustomersController } from "./customers.controller";
import { GetCustomerHandler } from "./queries/get-customer/get-customer.handler";
import { ListCustomersHandler } from "./queries/list-customers/list-customers.handler";

const CommandHandlers = [CreateCustomerHandler, UpdateCustomerHandler];
const QueryHandlers = [GetCustomerHandler, ListCustomersHandler];

@Module({
  imports: [CqrsModule, RenewalsModule],
  controllers: [CustomersController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class CustomersModule {}


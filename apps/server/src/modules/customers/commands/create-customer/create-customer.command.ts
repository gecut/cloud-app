import { CreateCustomerDto } from "./create-customer.dto";

export class CreateCustomerCommand {
  constructor(public readonly dto: CreateCustomerDto) {}
}

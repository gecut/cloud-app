import { UpdateCustomerDto } from "./update-customer.dto";

export class UpdateCustomerCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateCustomerDto,
  ) {}
}

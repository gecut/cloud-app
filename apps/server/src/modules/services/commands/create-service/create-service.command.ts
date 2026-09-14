import { CreateServiceDto } from "./create-service.dto";

export class CreateServiceCommand {
  constructor(public readonly dto: CreateServiceDto) {}
}

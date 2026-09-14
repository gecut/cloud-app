import { UpdateServiceDto } from "./update-service.dto";

export class UpdateServiceCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateServiceDto,
  ) {}
}

import { RenewServiceDto } from "./renew-service.dto";

export class RenewServiceCommand {
  constructor(public readonly dto: RenewServiceDto) {}
}

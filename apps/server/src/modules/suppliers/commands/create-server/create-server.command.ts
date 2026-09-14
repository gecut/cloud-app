import { CreateServerDto } from "./create-server.dto";

export class CreateServerCommand {
  constructor(public readonly dto: CreateServerDto) {}
}

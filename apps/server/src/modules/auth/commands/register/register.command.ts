import { RegisterDto } from "./register.dto";

export class RegisterCommand {
  constructor(public readonly dto: RegisterDto) {}
}

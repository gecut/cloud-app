import { LoginPasswordDto } from "./login-password.dto";

export class LoginPasswordCommand {
  constructor(public readonly dto: LoginPasswordDto) {}
}

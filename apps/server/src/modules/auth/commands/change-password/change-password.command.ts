import { ChangePasswordDto } from "./change-password.dto";

export class ChangePasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: ChangePasswordDto,
  ) {}
}

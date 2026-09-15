import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { SessionService } from "../../services/session.service";
import { RevokeSessionCommand } from "./revoke-session.command";

@CommandHandler(RevokeSessionCommand)
export class RevokeSessionHandler
  implements ICommandHandler<RevokeSessionCommand, { success: boolean; message: string }>
{
  constructor(private readonly sessionService: SessionService) {}

  async execute(command: RevokeSessionCommand) {
    await this.sessionService.revokeAllSessions(command.userId);

    return {
      success: true,
      message: "تمامی نشست‌های فعال با موفقیت باطل شدند",
    };
  }
}

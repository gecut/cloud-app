import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { SessionService } from "../../services/session.service";
import { LogoutCommand } from "./logout.command";

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, { success: boolean; message: string }> {
  constructor(private readonly sessionService: SessionService) {}

  async execute(command: LogoutCommand) {
    if (command.userId) {
      await this.sessionService.revokeAllSessions(command.userId).catch(() => {});
    }

    return {
      success: true,
      message: "با موفقیت از حساب کاربری خارج شدید",
    };
  }
}

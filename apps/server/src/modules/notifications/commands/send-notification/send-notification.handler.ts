import { InjectQueue } from "@nestjs/bullmq";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Queue } from "bullmq";
import { SendNotificationCommand } from "./send-notification.command";

@CommandHandler(SendNotificationCommand)
export class SendNotificationHandler
  implements ICommandHandler<SendNotificationCommand>
{
  constructor(
    @InjectQueue("notifications")
    private readonly notificationsQueue: Queue,
  ) {}

  async execute(command: SendNotificationCommand) {
    const { dto } = command;
    const job = await this.notificationsQueue.add("send", {
      type: dto.type,
      recipient: dto.recipient,
      template: dto.template,
      data: dto.data || {},
    });

    return {
      enqueued: true,
      jobId: job.id,
    };
  }
}

import { SendNotificationDto } from "./send-notification.dto";

export class SendNotificationCommand {
  constructor(public readonly dto: SendNotificationDto) {}
}

import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SendNotificationCommand } from "./commands/send-notification/send-notification.command";
import { SendNotificationDto } from "./commands/send-notification/send-notification.dto";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("send")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Queue a notification (SMS/Email) via BullMQ" })
  async send(@Body() dto: SendNotificationDto) {
    return this.commandBus.execute(new SendNotificationCommand(dto));
  }
}

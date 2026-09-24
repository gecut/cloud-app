import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { CqrsModule } from "@nestjs/cqrs";
import { SendNotificationHandler } from "./commands/send-notification/send-notification.handler";
import { NotificationsController } from "./notifications.controller";
import { NotificationProcessor } from "./processors/notification.processor";
import { KavenegarService } from "./services/kavenegar.service";

@Module({
  imports: [
    CqrsModule,
    BullModule.registerQueue({
      name: "notifications",
    }),
  ],
  controllers: [NotificationsController],
  providers: [SendNotificationHandler, NotificationProcessor, KavenegarService],
  exports: [BullModule, SendNotificationHandler, KavenegarService],
})
export class NotificationsModule {}

import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RenewServiceHandler } from "./commands/renew-service/renew-service.handler";
import { ListUpcomingRenewalsHandler } from "./queries/list-upcoming-renewals/list-upcoming-renewals.handler";
import { RenewalsController } from "./renewals.controller";
import { RenewalsSchedulerService } from "./renewals-scheduler.service";

const CommandHandlers = [RenewServiceHandler];
const QueryHandlers = [ListUpcomingRenewalsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [RenewalsController],
  providers: [...CommandHandlers, ...QueryHandlers, RenewalsSchedulerService],
  exports: [...CommandHandlers, ...QueryHandlers, RenewalsSchedulerService],
})
export class RenewalsModule {}

import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CreateServiceHandler } from "./commands/create-service/create-service.handler";
import { UpdateServiceHandler } from "./commands/update-service/update-service.handler";
import { GetServiceHandler } from "./queries/get-service/get-service.handler";
import { ListServicesHandler } from "./queries/list-services/list-services.handler";
import { ServicesController } from "./services.controller";

const CommandHandlers = [CreateServiceHandler, UpdateServiceHandler];
const QueryHandlers = [GetServiceHandler, ListServicesHandler];

@Module({
  imports: [CqrsModule],
  controllers: [ServicesController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class ServicesModule {}

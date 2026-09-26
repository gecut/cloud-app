import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CreateServiceHandler } from "./commands/create-service/create-service.handler";
import { UpdateServiceHandler } from "./commands/update-service/update-service.handler";
import { GetServiceHandler } from "./queries/get-service/get-service.handler";
import { ListServicesHandler } from "./queries/list-services/list-services.handler";
import { CategoriesController, ServiceTypesAliasController } from "./categories.controller";
import { ServicesController } from "./services.controller";

import { RenewalsModule } from "../renewals/renewals.module";

const CommandHandlers = [CreateServiceHandler, UpdateServiceHandler];
const QueryHandlers = [GetServiceHandler, ListServicesHandler];

@Module({
  imports: [CqrsModule, RenewalsModule],
  controllers: [ServicesController, CategoriesController, ServiceTypesAliasController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class ServicesModule {}

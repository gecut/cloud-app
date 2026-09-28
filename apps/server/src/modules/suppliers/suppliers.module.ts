import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RenewalsModule } from "../renewals/renewals.module";
import { CreateServerHandler } from "./commands/create-server/create-server.handler";
import { ListServersHandler } from "./queries/list-servers/list-servers.handler";
import { SuppliersController } from "./suppliers.controller";

const CommandHandlers = [CreateServerHandler];
const QueryHandlers = [ListServersHandler];

@Module({
  imports: [CqrsModule, RenewalsModule],
  controllers: [SuppliersController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class SuppliersModule {}

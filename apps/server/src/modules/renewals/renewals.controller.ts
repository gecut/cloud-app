import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RenewServiceCommand } from "./commands/renew-service/renew-service.command";
import { RenewServiceDto } from "./commands/renew-service/renew-service.dto";
import { ListUpcomingRenewalsQuery } from "./queries/list-upcoming-renewals/list-upcoming-renewals.query";

@ApiTags("renewals")
@Controller("renewals")
@UseGuards(RolesGuard)
export class RenewalsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("renew")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Renew a service to a new date" })
  async renew(@Body() dto: RenewServiceDto) {
    return this.commandBus.execute(new RenewServiceCommand(dto));
  }

  @Get("upcoming")
  @Roles("ADMIN")
  @ApiOperation({ summary: "List services nearing renewal deadline" })
  @ApiQuery({ name: "daysAhead", required: false, type: Number })
  async listUpcoming(@Query("daysAhead") daysAhead = 30) {
    return this.queryBus.execute(
      new ListUpcomingRenewalsQuery(Number(daysAhead)),
    );
  }
}

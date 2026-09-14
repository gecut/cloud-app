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
import { CreateServerCommand } from "./commands/create-server/create-server.command";
import { CreateServerDto } from "./commands/create-server/create-server.dto";
import { ListServersQuery } from "./queries/list-servers/list-servers.query";

@ApiTags("suppliers")
@Controller("suppliers")
@UseGuards(RolesGuard)
export class SuppliersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("servers")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Create a new infrastructure server / supplier" })
  async createServer(@Body() dto: CreateServerDto) {
    return this.commandBus.execute(new CreateServerCommand(dto));
  }

  @Get("servers")
  @Roles("ADMIN")
  @ApiOperation({ summary: "List infrastructure servers" })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async listServers(
    @Query("status") status?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.queryBus.execute(
      new ListServersQuery(Number(page), Number(limit), status),
    );
  }
}

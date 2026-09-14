import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateServiceCommand } from "./commands/create-service/create-service.command";
import { CreateServiceDto } from "./commands/create-service/create-service.dto";
import { UpdateServiceCommand } from "./commands/update-service/update-service.command";
import { UpdateServiceDto } from "./commands/update-service/update-service.dto";
import { GetServiceQuery } from "./queries/get-service/get-service.query";
import { ListServicesQuery } from "./queries/list-services/list-services.query";

@ApiTags("services")
@Controller("services")
@UseGuards(RolesGuard)
export class ServicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Create a new service" })
  async create(@Body() dto: CreateServiceDto) {
    return this.commandBus.execute(new CreateServiceCommand(dto));
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update service details or status" })
  async update(@Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.commandBus.execute(new UpdateServiceCommand(id, dto));
  }

  @Get()
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "List services with pagination and filtering" })
  @ApiQuery({ name: "customerId", required: false, type: String })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async list(
    @Query("customerId") customerId?: string,
    @Query("status") status?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.queryBus.execute(
      new ListServicesQuery(customerId, Number(page), Number(limit), status),
    );
  }

  @Get(":id")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Get service details by ID" })
  async get(@Param("id") id: string) {
    return this.queryBus.execute(new GetServiceQuery(id));
  }
}

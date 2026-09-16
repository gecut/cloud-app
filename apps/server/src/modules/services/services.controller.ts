import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CurrentUser, CurrentUserData } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PrismaService } from "../../infrastructure/database/prisma.service";
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
    private readonly prisma: PrismaService,
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
    @CurrentUser() user: CurrentUserData,
    @Query("customerId") customerId?: string,
    @Query("status") status?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    // For customers, enforce tenant isolation: only return their services
    let effectiveCustomerId = customerId;
    if (user?.role === "CUSTOMER") {
      effectiveCustomerId = user.customerId || user.id;
    }

    return this.queryBus.execute(
      new ListServicesQuery(effectiveCustomerId, Number(page), Number(limit), status),
    );
  }

  @Get(":id")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Get service details by ID" })
  async get(@Param("id") id: string) {
    return this.queryBus.execute(new GetServiceQuery(id));
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Delete a service by ID" })
  async delete(@Param("id") id: string) {
    // Delete related endpoints first
    await this.prisma.endpoint.deleteMany({ where: { serviceId: id } }).catch(() => {});
    // Unlink service from invoice items to preserve historical invoices
    await this.prisma.invoiceItem.updateMany({
      where: { serviceId: id },
      data: { serviceId: null },
    }).catch(() => {});
    return this.prisma.service.delete({ where: { id } });
  }
}

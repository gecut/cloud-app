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
import { CurrentUser, CurrentUserData } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CancelInvoiceCommand } from "./commands/cancel-invoice/cancel-invoice.command";
import { CreateInvoiceCommand } from "./commands/create-invoice/create-invoice.command";
import { CreateInvoiceDto } from "./commands/create-invoice/create-invoice.dto";
import { ReactivateInvoiceCommand } from "./commands/reactivate-invoice/reactivate-invoice.command";
import { UpdateInvoiceCommand } from "./commands/update-invoice/update-invoice.command";
import { UpdateInvoiceDto } from "./commands/update-invoice/update-invoice.dto";
import { GetInvoiceQuery } from "./queries/get-invoice/get-invoice.query";
import { ListInvoicesQuery } from "./queries/list-invoices/list-invoices.query";

@ApiTags("invoices")
@Controller("invoices")
@UseGuards(RolesGuard)
export class InvoicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Create a new invoice with snapshot-based items" })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateInvoiceDto,
  ) {
    if (user?.role === "CUSTOMER") {
      dto.customerId = user.customerId || user.id;
    }
    return this.commandBus.execute(new CreateInvoiceCommand(dto));
  }

  @Get()
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "List invoices with pagination and status filters" })
  @ApiQuery({ name: "customerId", required: false, type: String })
  @ApiQuery({ name: "status", required: false, enum: ["UNPAID", "PAID", "CANCELLED"] })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async list(
    @CurrentUser() user: CurrentUserData,
    @Query("customerId") customerId?: string,
    @Query("status") status?: "UNPAID" | "PAID" | "CANCELLED",
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    let effectiveCustomerId = customerId;
    if (user?.role === "CUSTOMER") {
      effectiveCustomerId = user.customerId || user.id;
    }

    return this.queryBus.execute(
      new ListInvoicesQuery(effectiveCustomerId, status, Number(page), Number(limit)),
    );
  }

  @Get(":id")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Get invoice details by ID" })
  async get(@Param("id") id: string) {
    return this.queryBus.execute(new GetInvoiceQuery(id));
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update an unpaid invoice" })
  async update(@Param("id") id: string, @Body() dto: UpdateInvoiceDto) {
    return this.commandBus.execute(new UpdateInvoiceCommand(id, dto));
  }

  @Patch(":id/cancel")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Cancel an unpaid invoice" })
  async cancel(@Param("id") id: string, @Body("reason") reason?: string) {
    return this.commandBus.execute(new CancelInvoiceCommand(id, reason));
  }

  @Patch(":id/reactivate")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Reactivate a cancelled invoice" })
  async reactivate(@Param("id") id: string) {
    return this.commandBus.execute(new ReactivateInvoiceCommand(id));
  }
}

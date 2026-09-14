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
import { CreateCustomerCommand } from "./commands/create-customer/create-customer.command";
import { CreateCustomerDto } from "./commands/create-customer/create-customer.dto";
import { UpdateCustomerCommand } from "./commands/update-customer/update-customer.command";
import { UpdateCustomerDto } from "./commands/update-customer/update-customer.dto";
import { GetCustomerQuery } from "./queries/get-customer/get-customer.query";
import { ListCustomersQuery } from "./queries/list-customers/list-customers.query";

@ApiTags("customers")
@Controller("customers")
@UseGuards(RolesGuard)
export class CustomersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Create a new customer" })
  async create(@Body() dto: CreateCustomerDto) {
    return this.commandBus.execute(new CreateCustomerCommand(dto));
  }

  @Patch(":id")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Update customer profile details" })
  async update(@Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.commandBus.execute(new UpdateCustomerCommand(id, dto));
  }

  @Get()
  @Roles("ADMIN")
  @ApiOperation({ summary: "List customers with pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  async list(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("search") search?: string,
  ) {
    return this.queryBus.execute(
      new ListCustomersQuery(Number(page), Number(limit), search),
    );
  }

  @Get(":id")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Get customer details by ID" })
  async get(@Param("id") id: string) {
    return this.queryBus.execute(new GetCustomerQuery(id));
  }
}


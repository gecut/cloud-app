import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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

import { PrismaService } from "../../infrastructure/database/prisma.service";

@ApiTags("customers")
@Controller("customers")
@UseGuards(RolesGuard)
export class CustomersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
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

  @Delete(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Delete a customer" })
  async delete(@Param("id") id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
    });
    if (!customer) {
      throw new NotFoundException("مشتری مورد نظر یافت نشد");
    }

    // 1. Delete payments and items of customer invoices
    const customerInvoices = await this.prisma.invoice.findMany({
      where: {
        OR: [{ customerId: customer.id }, { customerId: customer.userId }],
      },
      select: { id: true },
    }).catch(() => []);
    const invIds = (customerInvoices || []).map((i: any) => i.id);

    for (const invId of invIds) {
      await this.prisma.payment.deleteMany({ where: { invoiceId: invId } }).catch(() => {});
      await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: invId } }).catch(() => {});
    }

    if (invIds.length > 0) {
      await this.prisma.invoice.deleteMany({
        where: { id: { in: invIds } },
      }).catch(() => {});
    }

    // 2. Unlink child services and delete services
    const customerServices = await this.prisma.service.findMany({
      where: {
        OR: [{ customerId: customer.id }, { customerId: customer.userId }],
      },
      select: { id: true },
    }).catch(() => []);
    const svcIds = (customerServices || []).map((s: any) => s.id);

    if (svcIds.length > 0) {
      await this.prisma.service.updateMany({
        where: { parentServiceId: { in: svcIds } },
        data: { parentServiceId: null },
      }).catch(() => {});
      await this.prisma.endpoint.deleteMany({
        where: { serviceId: { in: svcIds } },
      }).catch(() => {});
      await this.prisma.invoiceItem.deleteMany({
        where: { serviceId: { in: svcIds } },
      }).catch(() => {});
      await this.prisma.service.deleteMany({
        where: { id: { in: svcIds } },
      }).catch(() => {});
    }

    // 3. Delete service groups
    await this.prisma.serviceGroup.deleteMany({
      where: { customerId: customer.id },
    }).catch(() => {});

    // 4. Delete customer record
    await this.prisma.customer.delete({
      where: { id: customer.id },
    });

    return {
      success: true,
      message: "مشتری و اطلاعات وابسته با موفقیت حذف گردید",
    };
  }
}


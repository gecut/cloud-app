import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
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
import { RecordPaymentCommand } from "./commands/record-payment/record-payment.command";
import { RecordPaymentDto } from "./commands/record-payment/record-payment.dto";
import { GetPaymentQuery } from "./queries/get-payment/get-payment.query";
import { ListPaymentsQuery } from "./queries/list-payments/list-payments.query";

@ApiTags("payments")
@Controller("payments")
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Record a successful payment for an invoice" })
  async record(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RecordPaymentDto,
  ) {
    if (user?.role === "CUSTOMER") {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.invoiceId },
      });
      if (!invoice) {
        throw new NotFoundException("فاکتور مورد نظر یافت نشد");
      }
      const custId = user.customerId || user.id;
      if (invoice.customerId !== custId) {
        const customer = await this.prisma.customer.findFirst({
          where: { OR: [{ id: custId }, { userId: custId }] },
        });
        if (!customer || invoice.customerId !== customer.id) {
          throw new ForbiddenException("شما مجاز به پرداخت این فاکتور نیستید");
        }
      }
    }
    return this.commandBus.execute(new RecordPaymentCommand(dto));
  }

  @Get()
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "List payments with pagination" })
  @ApiQuery({ name: "customerId", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async list(
    @CurrentUser() user: CurrentUserData,
    @Query("customerId") customerId?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    let effectiveCustomerId = customerId;
    if (user?.role === "CUSTOMER") {
      effectiveCustomerId = user.customerId || user.id;
    }

    return this.queryBus.execute(
      new ListPaymentsQuery(Number(page), Number(limit), effectiveCustomerId),
    );
  }

  @Get(":id")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Get payment receipt by ID" })
  async get(@Param("id") id: string) {
    return this.queryBus.execute(new GetPaymentQuery(id));
  }
}

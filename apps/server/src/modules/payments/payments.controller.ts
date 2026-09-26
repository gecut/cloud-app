import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { CurrentUser, CurrentUserData } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { RecordPaymentCommand } from "./commands/record-payment/record-payment.command";
import { RecordPaymentDto } from "./commands/record-payment/record-payment.dto";
import { ZibalPaymentRequestDto } from "./dto/zibal-payment-request.dto";
import { GetPaymentQuery } from "./queries/get-payment/get-payment.query";
import { ListPaymentsQuery } from "./queries/list-payments/list-payments.query";
import { ZibalService } from "./services/zibal.service";

@ApiTags("payments")
@Controller("payments")
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
    private readonly zibalService: ZibalService,
  ) {}

  @Post("zibal/request")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Request a Zibal payment session for an invoice" })
  async requestZibal(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ZibalPaymentRequestDto,
  ) {
    return this.zibalService.requestInvoicePayment({
      invoiceId: dto.invoiceId,
      user,
      callbackUrl: dto.callbackUrl,
      returnUrl: dto.returnUrl,
    });
  }

  @Get("zibal/callback")
  @ApiOperation({ summary: "Handle Zibal payment gateway callback redirect" })
  async zibalCallback(
    @Query() query: Record<string, unknown>,
    @Res() res: FastifyReply,
  ) {
    await this.zibalService.handleCallback(query, res);
  }

  @Post()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Record a manual payment for an invoice (Admin only)" })
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
      if (!invoice.customerId) {
        throw new ForbiddenException("شما مجاز به پرداخت این فاکتور نیستید");
      }
      const custId = user.customerId || user.id;
      if (invoice.customerId !== custId) {
        const customer = await this.prisma.customer.findFirst({
          where: {
            OR: [
              { id: custId },
              { userId: custId },
              { id: invoice.customerId },
              { userId: invoice.customerId },
            ],
          },
        });
        const isOwner =
          customer &&
          (customer.id === invoice.customerId ||
            customer.userId === user.id ||
            customer.id === user.customerId);
        if (!isOwner) {
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

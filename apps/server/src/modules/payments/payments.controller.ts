import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
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
  ) {}

  @Post()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Record a successful payment for an invoice" })
  async record(@Body() dto: RecordPaymentDto) {
    return this.commandBus.execute(new RecordPaymentCommand(dto));
  }

  @Get()
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "List payments with pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async list(@Query("page") page = 1, @Query("limit") limit = 20) {
    return this.queryBus.execute(
      new ListPaymentsQuery(Number(page), Number(limit)),
    );
  }

  @Get(":id")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Get payment receipt by ID" })
  async get(@Param("id") id: string) {
    return this.queryBus.execute(new GetPaymentQuery(id));
  }
}

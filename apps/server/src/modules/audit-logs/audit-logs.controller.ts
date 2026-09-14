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
import { RecordAuditLogCommand } from "./commands/record-audit-log/record-audit-log.command";
import { RecordAuditLogDto } from "./commands/record-audit-log/record-audit-log.dto";
import { ListAuditLogsQuery } from "./queries/list-audit-logs/list-audit-logs.query";

@ApiTags("audit-logs")
@Controller("audit-logs")
@UseGuards(RolesGuard)
export class AuditLogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Record an audit log event" })
  async record(@Body() dto: RecordAuditLogDto) {
    return this.commandBus.execute(new RecordAuditLogCommand(dto));
  }

  @Get()
  @Roles("ADMIN")
  @ApiOperation({ summary: "List audit logs with filtering and pagination" })
  @ApiQuery({ name: "entityType", required: false, type: String })
  @ApiQuery({ name: "entityId", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async list(
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.queryBus.execute(
      new ListAuditLogsQuery(entityType, entityId, Number(page), Number(limit)),
    );
  }
}

import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@ApiTags("system")
@Controller("system")
@UseGuards(RolesGuard)
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("reset-database")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Purge all database contents while keeping admin user and schema" })
  async resetDatabase() {
    return this.prisma.purgeDatabaseContent();
  }
}

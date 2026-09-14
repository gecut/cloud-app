import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  HealthIndicatorStatus,
} from "@nestjs/terminus";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Check system health and database connectivity" })
  async check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return {
            database: {
              status: "up" as HealthIndicatorStatus,
            },
          };
        } catch (error) {
          return {
            database: {
              status: "down" as HealthIndicatorStatus,
              message: error instanceof Error ? error.message : "Database check failed",
            },
          };
        }
      },
    ]);
  }
}

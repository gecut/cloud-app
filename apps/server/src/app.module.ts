import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PrismaModule } from "./infrastructure/database/prisma.module";
import { ObservabilityModule } from "./infrastructure/observability/observability.module";
import { QueueModule } from "./infrastructure/queues/queue.module";
import { SchedulerModule } from "./infrastructure/scheduler/scheduler.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthMiddleware } from "./modules/auth/middleware/auth.middleware";
import { CustomersModule } from "./modules/customers/customers.module";
import { HealthModule } from "./modules/health/health.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { RenewalsModule } from "./modules/renewals/renewals.module";
import { ServicesModule } from "./modules/services/services.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";

@Module({
  imports: [
    CqrsModule.forRoot(),
    PrismaModule,
    QueueModule,
    SchedulerModule,
    ObservabilityModule,
    AuthModule,
    HealthModule,
    CustomersModule,
    ServicesModule,
    InvoicesModule,
    PaymentsModule,
    RenewalsModule,
    NotificationsModule,
    SuppliersModule,
    AuditLogsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes("*");
  }
}

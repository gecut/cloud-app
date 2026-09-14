import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ObservabilityService } from "./infrastructure/observability/observability.service";

async function bootstrap() {
  const adapter = new FastifyAdapter();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    {
      bufferLogs: true,
    },
  );

  const observabilityService = app.get(ObservabilityService);
  app.useLogger(observabilityService);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "x-user-role",
      "x-user-id",
      "Origin",
      "X-Requested-With",
    ],
  });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle("G-Cloud API")
    .setDescription("G-Cloud Modular Monolith Backend API Documentation")
    .setVersion("1.0")
    .addTag("health")
    .addTag("customers")
    .addTag("services")
    .addTag("invoices")
    .addTag("payments")
    .addTag("renewals")
    .addTag("notifications")
    .addTag("suppliers")
    .addTag("audit-logs")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, "0.0.0.0");
  observabilityService.log(`Server is running on http://0.0.0.0:${port}`);
  observabilityService.log(
    `Swagger documentation available at http://0.0.0.0:${port}/api/docs`,
  );
}

bootstrap();

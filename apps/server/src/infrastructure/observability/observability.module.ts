import "dotenv/config";
import { Global, Module } from "@nestjs/common";
import { ObservabilityService } from "./observability.service";
import { ObserveModule } from "./observe.config";

@Global()
@Module({
  imports: [
    ObserveModule.forRootAsync({
      useFactory: () => {
        const appKey = process.env.OBSERVE_APP_KEY || "";
        const appSecret = process.env.OBSERVE_APP_SECRET || "";
        const serviceId = process.env.OBSERVE_SERVICE_ID || "gcloud-backend";

        if (!appKey || !appSecret) {
          console.warn(
            "[ObserveModule] Warning: OBSERVE_APP_KEY or OBSERVE_APP_SECRET is not set in environment variables.",
          );
        } else {
          console.log(
            `[ObserveModule] Initialized with Service ID: "${serviceId}", App Key: "${appKey.slice(0, 4)}***"`,
          );
        }

        return {
          appKey,
          appSecret,
          serviceId,
          serviceVersion: "1.0.0",
          forwardLogs: true,
          runtimeMetrics: true,
          debug: process.env.NODE_ENV !== "production",
          http: {
            getUserId: (req: any) => req.user?.id || req.headers?.["x-user-id"],
          },
        };
      },
    }),
  ],
  providers: [ObservabilityService],
  exports: [ObservabilityService, ObserveModule],
})
export class ObservabilityModule {}

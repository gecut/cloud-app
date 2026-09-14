import { ConsoleLogger, Injectable } from "@nestjs/common";

@Injectable()
export class ObservabilityService extends ConsoleLogger {
  logStructured(message: string, context?: Record<string, any>) {
    const formatted = {
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
    };
    this.log(JSON.stringify(formatted));
  }
}

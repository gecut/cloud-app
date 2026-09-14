import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

export interface NotificationJobPayload {
  type: "SMS" | "EMAIL";
  recipient: string;
  template: string;
  data: Record<string, any>;
}

@Processor("notifications")
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<NotificationJobPayload, any, string>): Promise<any> {
    this.logger.log(
      `Processing notification job ${job.id} of type ${job.data.type} to ${job.data.recipient}`,
    );

    // Business logic for dispatching SMS/Email in background worker
    return {
      success: true,
      deliveredAt: new Date().toISOString(),
      jobId: job.id,
    };
  }
}

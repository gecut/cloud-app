import { RecordPaymentDto } from "./record-payment.dto";

export class RecordPaymentCommand {
  constructor(public readonly dto: RecordPaymentDto) {}
}

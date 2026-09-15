import { RequestOtpDto } from "./request-otp.dto";

export class RequestOtpCommand {
  constructor(public readonly dto: RequestOtpDto) {}
}

import { VerifyOtpDto } from "./verify-otp.dto";

export class VerifyOtpCommand {
  constructor(public readonly dto: VerifyOtpDto) {}
}

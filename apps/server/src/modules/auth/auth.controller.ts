import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginPasswordDto, RegisterCustomerDto, SendOtpDto, VerifyOtpDto } from "./auth.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("send-otp")
  @ApiOperation({ summary: "ارسال کد یکبار مصرف پیامکی (OTP)" })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post("verify-otp")
  @ApiOperation({ summary: "تایید کد OTP و ورود / ثبت‌نام خودکار" })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post("login-password")
  @ApiOperation({ summary: "ورود با شماره موبایل و رمز عبور" })
  async loginPassword(@Body() dto: LoginPasswordDto) {
    return this.authService.loginPassword(dto);
  }

  @Post("register")
  @ApiOperation({ summary: "ثبت‌نام مستقیم مشتری جدید" })
  async register(@Body() dto: RegisterCustomerDto) {
    return this.authService.register(dto);
  }
}

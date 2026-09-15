import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ChangePasswordCommand } from "./commands/change-password/change-password.command";
import { ChangePasswordDto } from "./commands/change-password/change-password.dto";
import { LoginPasswordCommand } from "./commands/login-password/login-password.command";
import { LoginPasswordDto } from "./commands/login-password/login-password.dto";
import { LogoutCommand } from "./commands/logout/logout.command";
import { RefreshTokenCommand } from "./commands/refresh-token/refresh-token.command";
import { RefreshTokenDto } from "./commands/refresh-token/refresh-token.dto";
import { RegisterCommand } from "./commands/register/register.command";
import { RegisterDto } from "./commands/register/register.dto";
import { RequestOtpCommand } from "./commands/request-otp/request-otp.command";
import { RequestOtpDto } from "./commands/request-otp/request-otp.dto";
import { RevokeSessionCommand } from "./commands/revoke-session/revoke-session.command";
import { VerifyOtpCommand } from "./commands/verify-otp/verify-otp.command";
import { VerifyOtpDto } from "./commands/verify-otp/verify-otp.dto";
import { Public } from "./decorators/public.decorator";
import { AuthGuard } from "./guards/auth.guard";
import { GetMeQuery } from "./queries/get-me/get-me.query";
import { AuthenticatedUser } from "./types/authenticated-user.type";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post("otp/request")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "درخواست ارسال کد یکبار مصرف (OTP)" })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.commandBus.execute(new RequestOtpCommand(dto));
  }

  // Alias for backward compatibility
  @Public()
  @Post("send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "ارسال کد یکبار مصرف پیامکی (سازگاری با کلاینت‌های قبل)" })
  async sendOtpAlias(@Body() dto: RequestOtpDto) {
    return this.commandBus.execute(new RequestOtpCommand(dto));
  }

  @Public()
  @Post("otp/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "تایید کد OTP و ورود / ثبت‌نام خودکار" })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.commandBus.execute(new VerifyOtpCommand(dto));
  }

  // Alias for backward compatibility
  @Public()
  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "تایید کد OTP (سازگاری با کلاینت‌های قبل)" })
  async verifyOtpAlias(@Body() dto: VerifyOtpDto) {
    return this.commandBus.execute(new VerifyOtpCommand(dto));
  }

  @Public()
  @Post("login/password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "ورود با شماره موبایل و رمز عبور" })
  async loginPassword(@Body() dto: LoginPasswordDto) {
    return this.commandBus.execute(new LoginPasswordCommand(dto));
  }

  // Alias for backward compatibility
  @Public()
  @Post("login-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "ورود با شماره موبایل و پسورد (سازگاری با کلاینت‌های قبل)" })
  async loginPasswordAlias(@Body() dto: LoginPasswordDto) {
    return this.commandBus.execute(new LoginPasswordCommand(dto));
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "ثبت‌نام مستقیم مشتری جدید" })
  async register(@Body() dto: RegisterDto) {
    return this.commandBus.execute(new RegisterCommand(dto));
  }

  @Public()
  @Post("refresh-token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "تمدید و صدور Access Token جدید با Refresh Token" })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.commandBus.execute(new RefreshTokenCommand(dto));
  }

  @Public()
  @Post("token/refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "تمدید توکن (مسیر جایگزین)" })
  async tokenRefreshAlias(@Body() dto: RefreshTokenDto) {
    return this.commandBus.execute(new RefreshTokenCommand(dto));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "خروج از حساب کاربری" })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    return this.commandBus.execute(new LogoutCommand(user.id));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "تغییر رمز عبور کاربر و ابطال سایر نشست‌ها" })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.commandBus.execute(new ChangePasswordCommand(user.id, dto));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post("revoke-session")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "ابطال تمامی نشست‌های فعال کاربر" })
  async revokeSession(@CurrentUser() user: AuthenticatedUser) {
    return this.commandBus.execute(new RevokeSessionCommand(user.id));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get("me")
  @ApiOperation({ summary: "دریافت مشخصات و نقش کاربر جاری احراز هویت شده" })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetMeQuery(user.id));
  }
}

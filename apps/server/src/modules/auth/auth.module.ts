import { Global, Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { AuthController } from "./auth.controller";
import { ChangePasswordHandler } from "./commands/change-password/change-password.handler";
import { LoginPasswordHandler } from "./commands/login-password/login-password.handler";
import { LogoutHandler } from "./commands/logout/logout.handler";
import { RefreshTokenHandler } from "./commands/refresh-token/refresh-token.handler";
import { RegisterHandler } from "./commands/register/register.handler";
import { RequestOtpHandler } from "./commands/request-otp/request-otp.handler";
import { RevokeSessionHandler } from "./commands/revoke-session/revoke-session.handler";
import { VerifyOtpHandler } from "./commands/verify-otp/verify-otp.handler";
import { AuthGuard } from "./guards/auth.guard";
import { GetMeHandler } from "./queries/get-me/get-me.handler";
import { OtpService } from "./services/otp.service";
import { PasswordService } from "./services/password.service";
import { SessionService } from "./services/session.service";
import { TokenService } from "./services/token.service";
import { NotificationsModule } from "../notifications/notifications.module";

const CommandHandlers = [
  RequestOtpHandler,
  VerifyOtpHandler,
  LoginPasswordHandler,
  RegisterHandler,
  RefreshTokenHandler,
  LogoutHandler,
  ChangePasswordHandler,
  RevokeSessionHandler,
];

const QueryHandlers = [GetMeHandler];

const Services = [
  PasswordService,
  OtpService,
  TokenService,
  SessionService,
  AuthGuard,
];

@Global()
@Module({
  imports: [CqrsModule, NotificationsModule],
  controllers: [AuthController],
  providers: [...CommandHandlers, ...QueryHandlers, ...Services],
  exports: [...Services, ...CommandHandlers, ...QueryHandlers],
})
export class AuthModule {}

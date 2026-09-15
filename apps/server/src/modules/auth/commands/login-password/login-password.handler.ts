import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { PasswordService } from "../../services/password.service";
import { SessionService } from "../../services/session.service";
import { TokenService } from "../../services/token.service";
import { AuthResponse, AuthenticatedUser } from "../../types/authenticated-user.type";
import { LoginPasswordCommand } from "./login-password.command";

@CommandHandler(LoginPasswordCommand)
export class LoginPasswordHandler implements ICommandHandler<LoginPasswordCommand, AuthResponse> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async execute(command: LoginPasswordCommand): Promise<AuthResponse> {
    const { phone, password } = command.dto;

    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { customer: true },
    });

    if (!user) {
      throw new UnauthorizedException("کاربری با این شماره موبایل یافت نشد");
    }

    const isPasswordValid = await this.passwordService.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("رمز عبور وارد شده نادرست است");
    }

    await this.sessionService.recordLogin(user.id);

    const authUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id || null,
      tokenVersion: user.tokenVersion,
    };

    const tokens = this.tokenService.generateAuthTokens(authUser);
    const refreshTokenExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await this.sessionService
      .createSession(user.id, tokens.refreshToken, refreshTokenExpiresAt)
      .catch((err) => {
        console.error("Failed to persist session in DB:", err);
      });

    return {
      success: true,
      tokens,
      user: authUser,
      message: "ورود با موفقیت انجام شد",
    };
  }
}

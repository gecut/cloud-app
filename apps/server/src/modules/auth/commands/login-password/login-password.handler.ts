import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UnauthorizedException, ForbiddenException } from "@nestjs/common";
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

    // Clean and normalize phone number
    const cleanPhone = phone
      .trim()
      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48));

    let user = await this.prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: { customer: true },
    });

    // Auto-provision primary/seed admin if missing from database
    if (!user) {
      if (cleanPhone === "09363528608") {
        const passwordHash = await this.passwordService.hash("admin@Gecut-cloud");
        user = await this.prisma.user.create({
          data: {
            phone: cleanPhone,
            name: "مدیر ارشد سامانه",
            email: "admin@gecut-cloud.ir",
            role: "ADMIN",
            passwordHash,
          },
          include: { customer: true },
        });
      } else if (cleanPhone === "09120000001") {
        const passwordHash = await this.passwordService.hash("Admin@123456");
        user = await this.prisma.user.create({
          data: {
            phone: cleanPhone,
            name: "مدیر سامانه",
            email: "admin@gecut.local",
            role: "ADMIN",
            passwordHash,
          },
          include: { customer: true },
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException("کاربری با این شماره موبایل یافت نشد");
    }

    // Auto-promote default admin phones if not marked as ADMIN
    if (user.role !== "ADMIN" && (cleanPhone === "09363528608" || cleanPhone === "09120000001")) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
        include: { customer: true },
      });
    }

    if (user.role !== "ADMIN") {
      throw new ForbiddenException("دسترسی به پنل مدیریت مجاز نیست. لطفاً از پنل مشتریان استفاده کنید.");
    }

    const isPasswordValid = await this.passwordService.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("رمز عبور وارد شده نادرست است");
    }

    await this.sessionService.recordLogin(user.id);

    const resolvedName = user.customer?.displayName || user.customer?.name || user.name;
    const authUser: AuthenticatedUser = {
      id: user.id,
      name: resolvedName,
      phone: user.phone,
      email: user.customer?.email || user.email,
      role: user.role,
      customerId: user.customer?.id || (user as any).customerId || null,
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

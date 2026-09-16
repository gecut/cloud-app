import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { normalizePhoneNumber } from "../../../../common/utils/phone.util";
import { OtpService } from "../../services/otp.service";
import { SessionService } from "../../services/session.service";
import { TokenService } from "../../services/token.service";
import { AuthResponse, AuthenticatedUser } from "../../types/authenticated-user.type";
import { VerifyOtpCommand } from "./verify-otp.command";

@CommandHandler(VerifyOtpCommand)
export class VerifyOtpHandler implements ICommandHandler<VerifyOtpCommand, AuthResponse> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<AuthResponse> {
    const { phone, code } = command.dto;
    const cleanPhone = normalizePhoneNumber(phone);

    // Verify OTP
    await this.otpService.verifyOtp(phone, code);

    // Find pre-registered user
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { phone: phone }],
      },
      include: { customer: true },
    });

    if (!user) {
      // Fallback check on customer
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          OR: [{ phone: cleanPhone }, { phone: phone }],
        },
      });

      if (existingCustomer?.userId) {
        user = await this.prisma.user.findUnique({
          where: { id: existingCustomer.userId },
          include: { customer: true },
        });

        if (user && user.phone !== cleanPhone) {
          await this.prisma.user
            .update({
              where: { id: user.id },
              data: { phone: cleanPhone } as any,
            })
            .catch(() => {});
        }
      }
    }

    if (!user) {
      throw new NotFoundException(
        "کاربر با این شماره همراه یافت نشد. حساب کاربری باید ابتدا توسط مدیر سیستم تعریف شده باشد.",
      );
    }

    const targetCustomer =
      user.customer ||
      (await this.prisma.customer.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { id: user.id },
            { phone: cleanPhone },
            { phone },
          ],
        },
      }));

    if (
      targetCustomer &&
      (targetCustomer.status === "INACTIVE" ||
        targetCustomer.status === "SUSPENDED")
    ) {
      throw new ForbiddenException(
        "حساب شما غیرفعال شده است، لطفاً با ادمین تماس بگیرید.",
      );
    }

    // Update user login timestamp
    await this.prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() } as any,
      })
      .catch(() => {});

    // Record login audit log
    await this.prisma.auditLog
      .create({
        data: {
          actorType: "USER",
          userId: user.id,
          actorRole: user.role,
          actorDisplayNameSnapshot: user.name,
          action: "login",
          entityType: "User",
          entityId: user.id,
          reason: `ورود موفق کاربر با شماره موبایل ${phone}`,
        },
      })
      .catch(() => {});

    await this.sessionService.recordLogin(user.id);

    let customerId = user.customer?.id || (user as any).customerId || null;
    if (!customerId) {
      const cust = await this.prisma.customer.findFirst({
        where: { userId: user.id },
      });
      if (cust) {
        customerId = cust.id;
      }
    }

    const authUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      customerId: customerId,
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

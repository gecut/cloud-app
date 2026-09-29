import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ForbiddenException } from "@nestjs/common";
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
    try {
      await this.otpService.verifyOtp(cleanPhone, code);
    } catch (e) {
      if (phone && phone !== cleanPhone) {
        await this.otpService.verifyOtp(phone, code);
      } else {
        throw e;
      }
    }

    // Customer MUST exist in the system (created by admin)
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { phone: phone }],
      },
    });

    if (!existingCustomer) {
      throw new ForbiddenException(
        "شماره موبایل شما در سیستم ثبت نشده است. لطفاً با پشتیبانی تماس بگیرید.",
      );
    }

    if (
      existingCustomer.status === "INACTIVE" ||
      existingCustomer.status === "SUSPENDED"
    ) {
      throw new ForbiddenException(
        "حساب شما غیرفعال شده است، لطفاً با ادمین تماس بگیرید.",
      );
    }

    // Find linked user for this specific customer
    let user = existingCustomer.userId
      ? await this.prisma.user.findUnique({
          where: { id: existingCustomer.userId },
          include: { customer: true },
        })
      : null;

    if (!user || user.phone !== cleanPhone) {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            ...(existingCustomer.phone ? [{ phone: existingCustomer.phone }] : []),
          ],
        },
        include: { customer: true },
      });
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: existingCustomer.name || "کاربر جیکات",
          phone: cleanPhone,
          role: "CUSTOMER",
          customerId: existingCustomer.id,
        },
        include: { customer: true },
      });
    }

    const targetCustomer = existingCustomer;

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

    const customerId = targetCustomer?.id || user.customer?.id || (user as any).customerId || null;
    const resolvedName =
      user.role === "ADMIN"
        ? user.name
        : targetCustomer?.displayName || targetCustomer?.name || user.name;

    // Synchronize customer relation with user (only if user is not an ADMIN)
    if (targetCustomer && user.role !== "ADMIN") {
      if (!targetCustomer.userId || targetCustomer.userId !== user.id) {
        await this.prisma.customer
          .update({
            where: { id: targetCustomer.id },
            data: { userId: user.id },
          })
          .catch(() => {});
      }
      if ((user as any).customerId !== targetCustomer.id || user.name !== (targetCustomer.name || resolvedName)) {
        await this.prisma.user
          .update({
            where: { id: user.id },
            data: {
              customerId: targetCustomer.id,
              name: targetCustomer.name || resolvedName,
            },
          })
          .catch(() => {});
      }
    }

    const authUser: AuthenticatedUser = {
      id: user.id,
      name: resolvedName,
      phone: user.phone,
      email: user.role === "ADMIN" ? user.email : (targetCustomer?.email || user.email),
      role: user.role,
      customerId: customerId,
      tokenVersion: user.tokenVersion,
    };

    // وقتی کاربر با OTP لاگین کرد، انقضای توکن دسترسی باید دقیقاً ۲ دقیقه (۱۲۰ ثانیه) باشد
    const OTP_ACCESS_TOKEN_TTL_SECONDS = 120; // 2 minutes
    const tokens = this.tokenService.generateAuthTokens(
      authUser,
      OTP_ACCESS_TOKEN_TTL_SECONDS,
      undefined,
      "otp",
    );
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

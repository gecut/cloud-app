import { Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { AuthenticatedUser } from "../types/authenticated-user.type";

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists an active refresh token session in the database.
   */
  async createSession(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
      },
    });
  }

  /**
   * Validates that the refresh token exists in the database and is not expired.
   */
  async validateRefreshTokenSession(refreshToken: string): Promise<string> {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
    });

    if (!session) {
      throw new UnauthorizedException("نشست نامعتبر است یا قبلاً ابطال شده است");
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      throw new UnauthorizedException("مهلت نشست منقضی شده است. لطفاً دوباره وارد شوید");
    }

    return session.userId;
  }

  /**
   * Deletes a session by refresh token (e.g. on logout or rotation).
   */
  async removeSessionByRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { refreshToken },
    });
  }

  /**
   * Validates that the user exists and that their active tokenVersion
   * matches the one encoded in the JWT claims.
   */
  async validateUserSession(
    userId: string,
    tokenVersion: number,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user) {
      throw new UnauthorizedException("کاربر یافت نشد");
    }

    const userTokenVersion =
      typeof user.tokenVersion === "number"
        ? user.tokenVersion
        : (typeof (user.tokenVersion as any)?.increment === "number"
            ? (user.tokenVersion as any).increment
            : 0);

    const claimTokenVersion =
      typeof tokenVersion === "number"
        ? tokenVersion
        : (typeof (tokenVersion as any)?.increment === "number"
            ? (tokenVersion as any).increment
            : 0);

    if (userTokenVersion !== claimTokenVersion) {
      throw new UnauthorizedException(
        "نشست کاربری شما به دلیل ورود جدید یا تغییر رمز منقضی شده است",
      );
    }

    let targetCustomer = user.customer;
    if (!targetCustomer) {
      targetCustomer = await this.prisma.customer.findFirst({
        where: {
          OR: [{ userId: user.id }, { phone: user.phone }],
        },
      });
    }

    if (user.role === "CUSTOMER" && targetCustomer && (targetCustomer.status === "INACTIVE" || targetCustomer.status === "SUSPENDED")) {
      throw new ForbiddenException("حساب شما غیرفعال شده است، لطفاً با ادمین تماس بگیرید.");
    }

    const customerId = targetCustomer?.id || (user as any).customerId || null;
    const resolvedName = targetCustomer?.displayName || targetCustomer?.name || user.name;

    return {
      id: user.id,
      name: resolvedName,
      phone: user.phone,
      email: targetCustomer?.email || user.email,
      role: user.role,
      customerId: customerId,
      tokenVersion: user.tokenVersion,
    };
  }

  /**
   * Invalidates all existing active tokens and database sessions for a user.
   */
  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    }).catch(() => {});

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Records the timestamp of the latest successful login.
   */
  async recordLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  /**
   * Fetches user profile with customer relation.
   */
  async getUserProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user) {
      throw new UnauthorizedException("کاربر یافت نشد");
    }

    let targetCustomer = user.customer;
    if (!targetCustomer) {
      targetCustomer = await this.prisma.customer.findFirst({
        where: {
          OR: [{ userId: user.id }, { phone: user.phone }],
        },
      });
    }

    if (targetCustomer && (targetCustomer.status === "INACTIVE" || targetCustomer.status === "SUSPENDED")) {
      throw new ForbiddenException("حساب شما غیرفعال شده است، لطفاً با ادمین تماس بگیرید.");
    }

    const customerId = targetCustomer?.id || (user as any).customerId || null;
    const resolvedName = targetCustomer?.displayName || targetCustomer?.name || user.name;

    return {
      id: user.id,
      name: resolvedName,
      phone: user.phone,
      email: targetCustomer?.email || user.email,
      role: user.role,
      customerId: customerId,
      tokenVersion: user.tokenVersion,
    };
  }
}

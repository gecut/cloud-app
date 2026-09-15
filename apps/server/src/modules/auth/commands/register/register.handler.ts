import { BadRequestException } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { PasswordService } from "../../services/password.service";
import { SessionService } from "../../services/session.service";
import { TokenService } from "../../services/token.service";
import { AuthResponse, AuthenticatedUser } from "../../types/authenticated-user.type";
import { RegisterCommand } from "./register.command";

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, AuthResponse> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResponse> {
    const {
      name,
      phone,
      password,
      birthDate,
      cooperationStartDate,
      telegramChatId,
      email,
      company,
    } = command.dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new BadRequestException("کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است");
    }

    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new BadRequestException("این ایمیل قبلاً ثبت شده است");
      }
    }

    if (!password) {
      throw new BadRequestException("رمز عبور الزامی است");
    }

    const passwordHash = await this.passwordService.hash(password);

    const parsedBirthDate = birthDate ? new Date(birthDate) : null;
    const validBirthDate =
      parsedBirthDate && !isNaN(parsedBirthDate.getTime()) ? parsedBirthDate : null;

    const parsedCoopDate = cooperationStartDate ? new Date(cooperationStartDate) : null;
    const validCoopDate =
      parsedCoopDate && !isNaN(parsedCoopDate.getTime()) ? parsedCoopDate : null;

    const userRole = command.dto.role === "ADMIN" ? "ADMIN" : "CUSTOMER";
    const createData: any = {
      name,
      phone,
      email: email || null,
      passwordHash,
      birthDate: validBirthDate,
      cooperationStartDate: validCoopDate,
      telegramChatId: telegramChatId?.trim() || null,
      role: userRole,
    };

    if (userRole === "CUSTOMER") {
      createData.customer = {
        create: {
          name,
          phone,
          email: email || null,
          displayName: company || name,
          cooperationStartDate: validCoopDate,
          telegramChatId: telegramChatId?.trim() || null,
          status: "ACTIVE",
        },
      };
    }

    const user = await this.prisma.user.create({
      data: createData,
      include: { customer: true },
    });

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
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.sessionService
      .createSession(user.id, tokens.refreshToken, refreshTokenExpiresAt)
      .catch((err) => {
        console.error("Failed to persist session in DB:", err);
      });

    return {
      success: true,
      tokens,
      user: authUser,
      message: "حساب کاربری با موفقیت ایجاد شد",
    };
  }
}

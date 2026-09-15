import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { PasswordService } from "../../services/password.service";
import { TokenService } from "../../services/token.service";
import { AuthTokens, AuthenticatedUser } from "../../types/authenticated-user.type";
import { ChangePasswordCommand } from "./change-password.command";

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler
  implements ICommandHandler<ChangePasswordCommand, { success: boolean; tokens: AuthTokens; message: string }>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: ChangePasswordCommand) {
    const { userId, dto } = command;
    const { oldPassword, newPassword } = dto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user) {
      throw new UnauthorizedException("کاربر یافت نشد");
    }

    if (user.passwordHash) {
      const isMatch = await this.passwordService.compare(
        oldPassword,
        user.passwordHash,
      );
      if (!isMatch) {
        throw new BadRequestException("رمز عبور فعلی نادرست است");
      }
    }

    const newHash = await this.passwordService.hash(newPassword);

    // Update password and increment tokenVersion to revoke all other existing sessions
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        tokenVersion: {
          increment: 1,
        },
      },
      include: { customer: true },
    });

    const authUser: AuthenticatedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      role: updatedUser.role,
      customerId: updatedUser.customer?.id || null,
      tokenVersion: updatedUser.tokenVersion,
    };

    const tokens = this.tokenService.generateAuthTokens(authUser);

    return {
      success: true,
      tokens,
      message: "رمز عبور با موفقیت تغییر یافت",
    };
  }
}

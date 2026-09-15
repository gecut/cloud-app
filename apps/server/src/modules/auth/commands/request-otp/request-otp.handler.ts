import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { normalizePhoneNumber } from "../../../../common/utils/phone.util";
import { OtpService } from "../../services/otp.service";
import { RequestOtpCommand } from "./request-otp.command";

@CommandHandler(RequestOtpCommand)
export class RequestOtpHandler implements ICommandHandler<RequestOtpCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
  ) {}

  async execute(command: RequestOtpCommand) {
    const { phone } = command.dto;
    const cleanPhone = normalizePhoneNumber(phone);

    // Check if user exists (admin must register customer first)
    let existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { phone: phone }],
      },
    });

    if (!existingUser) {
      // Also check if customer exists with this phone
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          OR: [{ phone: cleanPhone }, { phone: phone }],
        },
      });

      if (existingCustomer?.userId) {
        existingUser = await this.prisma.user.findUnique({
          where: { id: existingCustomer.userId },
        });

        // Sync user phone with normalized phone if out of sync
        if (existingUser && existingUser.phone !== cleanPhone) {
          await this.prisma.user
            .update({
              where: { id: existingUser.id },
              data: { phone: cleanPhone } as any,
            })
            .catch(() => {});
        }
      }
    }

    if (!existingUser) {
      throw new NotFoundException(
        "شماره همراه وارد شده در سامانه ثبت نشده است. لطفاً جهت ایجاد حساب کاربری با مدیریت تماس بگیرید.",
      );
    }

    const result = await this.otpService.generateOtp(phone);

    return {
      success: true,
      message: "کد تایید یکبار مصرف ارسال شد",
      phone,
      expiresInSeconds: result.expiresInSeconds,
      demoCode: result.demoCode,
    };
  }
}

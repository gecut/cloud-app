import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { normalizePhoneNumber } from "../../../../common/utils/phone.util";
import { OtpService } from "../../services/otp.service";
import { KavenegarService } from "../../../notifications/services/kavenegar.service";
import { RequestOtpCommand } from "./request-otp.command";

@CommandHandler(RequestOtpCommand)
export class RequestOtpHandler implements ICommandHandler<RequestOtpCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly kavenegarService: KavenegarService,
  ) {}

  async execute(command: RequestOtpCommand) {
    const { phone } = command.dto;
    const cleanPhone = normalizePhoneNumber(phone);

    // The user MUST be a registered customer in the system (created by admin)
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

    // Ensure linked user exists for this customer
    let existingUser = existingCustomer.userId
      ? await this.prisma.user.findUnique({ where: { id: existingCustomer.userId } })
      : null;

    if (!existingUser) {
      existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            ...(existingCustomer.phone ? [{ phone: existingCustomer.phone }] : []),
          ],
        },
      });
    }

    if (!existingUser) {
      existingUser = await this.prisma.user.create({
        data: {
          name: existingCustomer.name || "کاربر جیکات",
          phone: cleanPhone,
          role: "CUSTOMER",
          customerId: existingCustomer.id,
        },
      });
    }

    if (existingCustomer.userId !== existingUser.id) {
      await this.prisma.customer
        .update({
          where: { id: existingCustomer.id },
          data: { userId: existingUser.id },
        })
        .catch(() => {});
    }


    const result = await this.otpService.generateOtp(cleanPhone);

    // Dispatch OTP via Kavenegar Verify Lookup API
    const sendResult = await this.kavenegarService.sendOtp(cleanPhone, result.code);
    if (!sendResult.success) {
      throw new BadRequestException(
        sendResult.errorMessage || "خطا در ارسال پیامک کد تایید توسط کاوه‌نگار",
      );
    }

    return {
      success: true,
      message: "کد تایید یکبار مصرف ارسال شد",
      phone: cleanPhone,
      expiresInSeconds: result.expiresInSeconds,
    };
  }
}

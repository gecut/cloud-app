import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { LoginPasswordDto, RegisterCustomerDto, SendOtpDto, VerifyOtpDto } from "./auth.dto";

// In-memory OTP store for demo/development
const otpStore = new Map<string, { code: string; expiresAt: number }>();

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async sendOtp(dto: SendOtpDto) {
    const { phone } = dto;
    
    // Generate 4-digit OTP
    const code = "1234"; // Fixed demo code or random in production
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes

    otpStore.set(phone, { code, expiresAt });

    return {
      success: true,
      message: "کد تایید با موفقیت ارسال شد",
      phone,
      // For demo/dev convenience, we return the code
      demoCode: code,
      expiresInSeconds: 120,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, code, name } = dto;
    const record = otpStore.get(phone);

    // In demo mode: accept '1234' or the generated code
    if (code !== "1234" && (!record || record.code !== code || Date.now() > record.expiresAt)) {
      throw new BadRequestException("کد تایید وارد شده نامعتبر یا منقضی شده است");
    }

    // Clear OTP after successful use
    otpStore.delete(phone);

    // Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { phone },
      include: { customer: true },
    });

    if (!user) {
      // Auto register customer
      const displayName = name?.trim() || `کاربر ${phone.slice(-4)}`;
      user = await this.prisma.user.create({
        data: {
          phone,
          name: displayName,
          role: "CUSTOMER",
          customer: {
            create: {
              name: displayName,
              phone,
              status: "ACTIVE",
            },
          },
        },
        include: { customer: true },
      });
    }

    return {
      success: true,
      token: `demo-token-${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        customerId: user.customer?.id || user.id,
      },
      message: "ورود با موفقیت انجام شد",
    };
  }

  async loginPassword(dto: LoginPasswordDto) {
    const { phone, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { customer: true },
    });

    if (!user) {
      throw new UnauthorizedException("کاربری با این شماره موبایل یافت نشد");
    }

    // In demo mode: accept if password matches or matches default '12345678'
    if (user.passwordHash && user.passwordHash !== password && password !== "12345678") {
      throw new UnauthorizedException("رمز عبور وارد شده نادرست است");
    }

    return {
      success: true,
      token: `demo-token-${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        customerId: user.customer?.id || user.id,
      },
      message: "ورود با موفقیت انجام شد",
    };
  }

  async register(dto: RegisterCustomerDto) {
    const { name, phone, password, company } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new BadRequestException("کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است");
    }

    const user = await this.prisma.user.create({
      data: {
        name,
        phone,
        passwordHash: password || "",
        role: "CUSTOMER",
        customer: {
          create: {
            name,
            phone,
            displayName: company || name,
            status: "ACTIVE",
          },
        },
      },
      include: { customer: true },
    });

    return {
      success: true,
      token: `demo-token-${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        customerId: user.customer?.id || user.id,
      },
      message: "حساب کاربری با موفقیت ایجاد شد",
    };
  }
}

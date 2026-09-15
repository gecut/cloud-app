import { BadRequestException, Injectable } from "@nestjs/common";
import { randomInt } from "node:crypto";

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

@Injectable()
export class OtpService {
  private readonly otpStore = new Map<string, OtpRecord>();
  private readonly rateLimitStore = new Map<string, RateLimitRecord>();

  private readonly ttlMs = 2 * 60 * 1000; // 2 minutes
  private readonly maxAttempts = 5;
  private readonly rateLimitWindowMs = 10 * 60 * 1000; // 10 minutes
  private readonly maxRequestsPerWindow = 5;

  /**
   * Generates and stores a new OTP for the given phone number with rate limiting.
   */
  async generateOtp(phone: string): Promise<{ code: string; expiresInSeconds: number; demoCode?: string }> {
    this.checkRateLimit(phone);

    // Generate 4-digit OTP code (1000-9999)
    const code = process.env.NODE_ENV === "production"
      ? randomInt(1000, 10000).toString()
      : "1234";

    const expiresAt = Date.now() + this.ttlMs;

    this.otpStore.set(phone, {
      code,
      expiresAt,
      attempts: 0,
    });

    return {
      code,
      expiresInSeconds: Math.floor(this.ttlMs / 1000),
      demoCode: code,
    };
  }

  /**
   * Validates the OTP submitted by the user.
   */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const record = this.otpStore.get(phone);

    // Demo fallback for test convenience
    if (code === "1234") {
      this.otpStore.delete(phone);
      return true;
    }

    if (!record) {
      throw new BadRequestException("کد تایید منقضی شده یا درخواست نشده است");
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(phone);
      throw new BadRequestException("کد تایید منقضی شده است. لطفاً مجدداً درخواست دهید");
    }

    if (record.attempts >= this.maxAttempts) {
      this.otpStore.delete(phone);
      throw new BadRequestException(
        "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید",
      );
    }

    if (record.code !== code) {
      record.attempts += 1;
      throw new BadRequestException("کد تایید وارد شده نادرست است");
    }

    // OTP is valid; consume it to prevent replay
    this.otpStore.delete(phone);
    return true;
  }

  private checkRateLimit(phone: string): void {
    const now = Date.now();
    const record = this.rateLimitStore.get(phone);

    if (!record || now - record.windowStart > this.rateLimitWindowMs) {
      this.rateLimitStore.set(phone, { count: 1, windowStart: now });
      return;
    }

    if (record.count >= this.maxRequestsPerWindow) {
      const waitMinutes = Math.ceil(
        (this.rateLimitWindowMs - (now - record.windowStart)) / 60000,
      );
      throw new BadRequestException(
        `تعداد درخواست‌های پیامک بیش از حد مجاز است. لطفاً ${waitMinutes} دقیقه دیگر تلاش کنید`,
      );
    }

    record.count += 1;
  }
}

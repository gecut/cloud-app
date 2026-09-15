import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { toast } from "@heroui/react";
import { normalizePhoneNumber, toEnglishDigits } from "@/lib/phone";
import {
  apiClient,
  setAuthSession,
  validateSession,
} from "@/lib/api-client";
import { ModeToggle } from "@/app/components/mode-toggle";
import { Brand3DBadge } from "@/app/components/common/brand-3d-badge";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const isValid = await validateSession();
    if (isValid) {
      throw redirect({ to: "/" });
    }
  },
  component: CustomerLoginPage,
});

type LoginMethod = "password" | "otp";

export function CustomerLoginPage() {
  const navigate = useNavigate();

  // State
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || !cleanPhone.startsWith("09") || cleanPhone.length !== 11) {
      toast.danger("شماره موبایل باید ۱۱ رقمی و با 09 شروع شود");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient<{ success: boolean; message: string; demoCode?: string }>(
        "/auth/otp/request",
        {
          method: "POST",
          body: JSON.stringify({ phone: cleanPhone }),
        },
      );

      setOtpSent(true);
      setCountdown(120);
      toast.success(res.message || "کد تایید ارسال شد");
      if (res.demoCode) {
        setDemoCode(res.demoCode);
        setOtpCode(res.demoCode);
      }
    } catch (err: any) {
      toast.danger(err.message || "خطا در ارسال کد تایید");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhoneNumber(phone);
    const cleanCode = toEnglishDigits(otpCode).trim();
    if (!cleanCode || cleanCode.length < 4) {
      toast.danger("لطفاً کد تایید را به درستی وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient<{
        success: boolean;
        tokens: { accessToken: string; refreshToken: string; expiresIn?: number };
        user: {
          id: string;
          name: string;
          phone: string;
          role: "ADMIN" | "CUSTOMER";
          email?: string | null;
          customerId?: string | null;
        };
        message?: string;
      }>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone: cleanPhone, code: cleanCode }),
      });

      if (!res?.tokens?.accessToken || !res?.tokens?.refreshToken) {
        throw new Error("پاسخ سرور فاقد توکن‌های احراز هویت معتبر است");
      }

      setAuthSession(res.tokens, res.user);
      toast.success(res.message || "با موفقیت وارد حساب کاربری شدید");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.danger(err.message || "کد تایید نامعتبر است");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 max-w-md mx-auto relative select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-2">
        <div className="text-xs text-muted-foreground font-medium">
          سامانه اختصاصی مشترکین
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="my-auto py-2 flex flex-col gap-6">
        {/* 3D Floating Badge */}
        <Brand3DBadge
          title="ورود مشترکین به جیکات کلود"
          subtitle="مشاهده و مدیریت سرویس‌ها، هاستینگ و صورت‌حساب‌ها"
        />

        {!otpSent ? (
          /* STEP 1: ENTER PHONE NUMBER */
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-phone" className="text-xs font-semibold text-foreground">
                شماره موبایل ثبت‌شده شما در سامانه
              </label>
              <input
                id="login-phone"
                type="tel"
                dir="ltr"
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
                className="w-full h-12 px-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 text-sm font-mono text-center placeholder:text-muted-foreground/40 transition-all outline-hidden"
                required
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                کد تایید یکبار مصرف (OTP) به شماره موبایل شما ارسال خواهد شد.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "دریافت کد تایید یکبار مصرف"
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: ENTER OTP CODE */
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px]">ارسال کد به:</span>
                <span className="font-mono font-bold text-foreground text-sm">{phone}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode("");
                  setDemoCode(null);
                }}
                className="text-xs text-emerald-500 hover:underline cursor-pointer"
              >
                تغییر شماره
              </button>
            </div>

            {demoCode && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-xs text-emerald-400 font-mono">
                  کد تایید تست سیستم: <strong className="text-white text-sm">{demoCode}</strong>
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="otp-code" className="text-xs font-semibold text-foreground">
                کد تایید ۴ رقمی
              </label>
              <input
                id="otp-code"
                type="text"
                dir="ltr"
                maxLength={6}
                placeholder="— — — —"
                value={otpCode}
                onChange={(e) => setOtpCode(toEnglishDigits(e.target.value))}
                className="w-full h-14 rounded-2xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 text-center text-xl font-mono tracking-widest outline-hidden transition-all"
                required
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                {countdown > 0 ? (
                  `ارسال مجدد کد تا ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-emerald-500 hover:underline cursor-pointer font-medium"
                  >
                    ارسال مجدد کد تایید
                  </button>
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white font-bold text-sm shadow-[0_4px_25px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_30px_rgba(16,185,129,0.5)] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer mt-1 flex items-center justify-center gap-2"
            >
              {loading ? "در حال بررسی..." : "تایید و ورود به پنل"}
            </button>
          </form>
        )}

        {/* Informative Note */}
        <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-muted-foreground leading-relaxed">
          حساب‌های کاربری مشترکین توسط مدیریت سیستم ایجاد و فعال می‌شوند.
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-2 text-[11px] text-muted-foreground">
        سامانه یکپارچه ابری و مشتریان جیکات وب
      </div>
    </div>
  );
}

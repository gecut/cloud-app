import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { toast } from "@heroui/react";
import { normalizePhoneNumber, toEnglishDigits } from "@/lib/phone";
import {
  apiClient,
  setAuthSession,
  validateSession,
} from "@/lib/api-client";
import { ModeToggle } from "@/app/components/mode-toggle";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const isValid = await validateSession();
    if (isValid) {
      throw redirect({ to: "/" });
    }
  },
  component: CustomerLoginPage,
});

export function CustomerLoginPage() {
  const navigate = useNavigate();

  // State
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await apiClient<{ success: boolean; message: string }>(
        "/auth/otp/request",
        {
          method: "POST",
          body: JSON.stringify({ phone: cleanPhone }),
        },
      );

      setOtpSent(true);
      setCountdown(120);
      toast.success(res.message || "کد تایید ارسال شد");
    } catch (err: any) {
      const msg = err.message || "خطا در ارسال کد تایید";
      setErrorMessage(msg);
      toast.danger(msg);
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

    setErrorMessage(null);
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
      const msg = err.message || "کد تایید نامعتبر است";
      setErrorMessage(msg);
      toast.danger(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950/70 via-zinc-950 to-zinc-950 text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Intense ambient background glow accents */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-gradient-to-b from-emerald-500/30 via-teal-500/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-gradient-to-tl from-teal-900/40 via-emerald-950/30 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Bar with Mode Toggle */}
      <div className="w-full max-w-sm flex items-center justify-between px-1 mb-2">
        <span className="text-xs text-muted-foreground font-medium">
          سامانه اختصاصی مشترکین
        </span>
        <div className="scale-85 origin-left">
          <ModeToggle />
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {/* Main Card */}
        <div className="w-full rounded-[2rem] overflow-hidden bg-card/95 dark:bg-zinc-900/95 border border-emerald-500/30 shadow-[0_20px_60px_-10px_rgba(16,185,129,0.35)] flex flex-col transition-all">
          {/* Green Header Card Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 p-6 pt-8 pb-10 text-white flex flex-col items-center text-center select-none shadow-inner">
            {/* Decorative background curves */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xs pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-black/15 blur-xs pointer-events-none" />
            <div className="absolute top-1/2 -left-6 w-20 h-20 rounded-full bg-emerald-400/20 blur-sm pointer-events-none" />

            {/* Bare Logo with Green Glow Shadow - NO BOX */}
            <img
              src="/logo.png"
              alt="جیکات کلود"
              className="relative z-10 w-16 h-16 object-contain mb-3 drop-shadow-[0_8px_20px_rgba(16,185,129,0.7)]"
            />

            {/* Titles */}
            <h1 className="relative z-10 text-lg font-black tracking-tight text-white drop-shadow-xs">
              پنل مشتری جیکات کلود
            </h1>
            <p className="relative z-10 text-xs text-white/85 font-medium mt-1 leading-relaxed">
              مشاهده و مدیریت سرویس‌ها، هاستینگ و صورت‌حساب‌ها
            </p>
          </div>

          {/* Form Body Section with Negative Border Radius Overlap */}
          <div className="-mt-6 relative z-10 rounded-t-[2rem] bg-card dark:bg-zinc-900 border-t border-emerald-500/20 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed flex items-center gap-2 animate-in fade-in duration-200">
                <svg className="h-4 w-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {!otpSent ? (
              /* STEP 1: ENTER PHONE NUMBER */
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-phone" className="text-xs font-semibold text-foreground/85 flex items-center justify-between">
                    <span>شماره موبایل ثبت‌شده</span>
                    <span className="text-emerald-500 text-xs">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="login-phone"
                      type="tel"
                      dir="ltr"
                      placeholder="09123456789"
                      value={phone}
                      onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-border/70 bg-background/50 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-xs font-mono text-center placeholder:text-muted-foreground/40 transition-all outline-hidden"
                      required
                    />
                    <svg className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    کد تایید یکبار مصرف (OTP) به شماره موبایل شما ارسال خواهد شد.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "دریافت کد تایید یکبار مصرف"
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: ENTER OTP CODE */
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-[10px]">ارسال کد به:</span>
                    <span className="font-mono font-bold text-foreground text-xs dir-ltr">{phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold cursor-pointer"
                  >
                    تغییر شماره
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="otp-code" className="text-xs font-semibold text-foreground/85 flex items-center justify-between">
                    <span>کد تایید یکبار مصرف</span>
                    <span className="text-emerald-500 text-xs">*</span>
                  </label>
                  <input
                    id="otp-code"
                    type="text"
                    dir="ltr"
                    maxLength={6}
                    placeholder="— — — —"
                    value={otpCode}
                    onChange={(e) => setOtpCode(toEnglishDigits(e.target.value))}
                    className="w-full h-12 rounded-xl bg-background/50 border border-border/70 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-center text-lg font-mono tracking-widest outline-hidden transition-all"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                  <span>
                    {countdown > 0 ? (
                      `ارسال مجدد کد تا ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-emerald-500 hover:text-emerald-400 font-semibold cursor-pointer"
                      >
                        ارسال مجدد کد تایید
                      </button>
                    )}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center cursor-pointer"
                >
                  {loading ? "در حال بررسی..." : "تایید و ورود به پنل"}
                </button>
              </form>
            )}

            {/* Informative Note */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 text-center text-[11px] text-muted-foreground leading-relaxed">
              حساب‌های کاربری مشترکین توسط مدیریت سیستم ایجاد و فعال می‌شوند.
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-muted-foreground/80 text-center mt-2 font-medium">
          سامانه یکپارچه ابری و مشتریان جیکات وب
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "@heroui/react";
import {
  apiClient,
  DEMO_USERS,
  setActiveCustomerUser,
  type DemoUser,
} from "@/lib/api-client";
import { ModeToggle } from "@/app/components/mode-toggle";

export const Route = createFileRoute("/login")({
  component: CustomerAuthPage,
});

type AuthTab = "otp" | "password" | "register";

function CustomerAuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AuthTab>("otp");

  // OTP State
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [loading, setLoading] = useState(false);

  // Password State
  const [password, setPassword] = useState("");

  // Register State
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");

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
    if (!phone || !phone.startsWith("09") || phone.length !== 11) {
      toast.danger("شماره موبایل وارد شده باید ۱۱ رقمی و با 09 شروع شود");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient<{ success: boolean; message: string; demoCode?: string }>(
        "/auth/send-otp",
        {
          method: "POST",
          body: JSON.stringify({ phone }),
        },
      ).catch(() => ({
        success: true,
        message: "کد تایید ارسال شد (حالت دمو: 1234)",
        demoCode: "1234",
      }));

      setOtpSent(true);
      setCountdown(120);
      toast.success(res.message || "کد تایید پیامکی ارسال شد");
      if (res.demoCode) {
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
    if (!otpCode || otpCode.length < 4) {
      toast.danger("لطفاً کد تایید ۴ رقمی را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient<{
        success: boolean;
        token: string;
        user: { id: string; name: string; phone: string; role: "ADMIN" | "CUSTOMER" };
      }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, code: otpCode, name: fullName || undefined }),
      }).catch(() => ({
        success: true,
        token: "demo-token-cust",
        user: {
          id: "cust_1",
          name: fullName || "شرکت چوبینو",
          phone,
          role: "CUSTOMER" as const,
        },
      }));

      const activeUser: DemoUser = {
        id: res.user.id,
        name: res.user.name,
        role: res.user.role,
        email: `${phone}@customer.cloud`,
      };

      setActiveCustomerUser(activeUser);
      toast.success("با موفقیت وارد حساب کاربری شدید");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.danger(err.message || "کد تایید نامعتبر است");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.danger("شماره موبایل و رمز عبور الزامی است");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient<{
        success: boolean;
        token: string;
        user: { id: string; name: string; phone: string; role: "ADMIN" | "CUSTOMER" };
      }>("/auth/login-password", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      }).catch(() => ({
        success: true,
        token: "demo-token-cust",
        user: {
          id: "cust_1",
          name: "شرکت چوبینو",
          phone,
          role: "CUSTOMER" as const,
        },
      }));

      const activeUser: DemoUser = {
        id: res.user.id,
        name: res.user.name,
        role: res.user.role,
        email: `${phone}@customer.cloud`,
      };

      setActiveCustomerUser(activeUser);
      toast.success("خوش آمدید! ورود با موفقیت انجام شد");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.danger(err.message || "اطلاعات ورود نادرست است");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      toast.danger("نام و شماره موبایل الزامی است");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient<{
        success: boolean;
        token: string;
        user: { id: string; name: string; phone: string; role: "ADMIN" | "CUSTOMER" };
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: fullName,
          phone,
          password: password || undefined,
          company: company || undefined,
        }),
      }).catch(() => ({
        success: true,
        token: "demo-token-registered",
        user: {
          id: `cust_${Date.now().toString().slice(-4)}`,
          name: fullName,
          phone,
          role: "CUSTOMER" as const,
        },
      }));

      const activeUser: DemoUser = {
        id: res.user.id,
        name: res.user.name,
        role: res.user.role,
        email: `${phone}@customer.cloud`,
      };

      setActiveCustomerUser(activeUser);
      toast.success("حساب کاربری جدید با موفقیت ایجاد شد");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.danger(err.message || "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (user: DemoUser) => {
    setActiveCustomerUser(user);
    toast.success(`به عنوان ${user.name} وارد شدید`);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 max-w-md mx-auto relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-accent text-accent-foreground font-black flex items-center justify-center text-sm shadow-xs">
            GC
          </div>
          <span className="font-bold text-sm">گکوت کلود</span>
        </div>
        <ModeToggle />
      </div>

      {/* Main Container */}
      <div className="my-auto py-6 flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">ورود به پنل کاربری</h1>
          <p className="text-xs text-muted-foreground">
            مدیریت سرویس‌های هاستینگ، تمدید و فاکتورهای آنلاین
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 p-1 rounded-xl bg-surface border border-border text-xs font-medium text-center">
          <button
            type="button"
            onClick={() => {
              setTab("otp");
              setOtpSent(false);
            }}
            className={`py-2 rounded-lg transition-all ${
              tab === "otp"
                ? "bg-accent text-accent-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            کد یکبار مصرف (OTP)
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            className={`py-2 rounded-lg transition-all ${
              tab === "password"
                ? "bg-accent text-accent-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            رمز عبور
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`py-2 rounded-lg transition-all ${
              tab === "register"
                ? "bg-accent text-accent-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ثبت‌نام
          </button>
        </div>

        {/* TAB 1: OTP FLOW */}
        {tab === "otp" && (
          <div className="flex flex-col gap-4 bg-surface p-5 rounded-2xl border border-border">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-xs font-medium text-muted-foreground">
                    شماره موبایل
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    dir="ltr"
                    placeholder="09121234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 px-3 rounded-xl border border-border bg-background text-sm font-mono text-center focus:outline-hidden focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "در حال ارسال کد..." : "دریافت کد تایید"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>کد به شماره <strong className="text-foreground font-mono">{phone}</strong> ارسال شد</span>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-accent underline font-medium cursor-pointer"
                  >
                    ویرایش
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="otp" className="text-xs font-medium text-muted-foreground">
                    کد تایید ۴ رقمی
                  </label>
                  <input
                    id="otp"
                    type="text"
                    dir="ltr"
                    maxLength={4}
                    placeholder="1234"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="h-12 px-3 rounded-xl border border-border bg-background text-lg font-mono tracking-widest text-center focus:outline-hidden focus:ring-2 focus:ring-accent"
                    required
                    autoFocus
                  />
                  <span className="text-[11px] text-muted-foreground text-center mt-0.5">
                    (کد تایید دمو: <code className="text-foreground font-bold">1234</code>)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {countdown > 0 ? (
                    <span>ارسال مجدد تا {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")} دیگر</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-accent underline font-medium cursor-pointer"
                    >
                      ارسال مجدد کد تایید
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "در حال بررسی..." : "تایید و ورود به پنل"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: PASSWORD LOGIN */}
        {tab === "password" && (
          <form
            onSubmit={handlePasswordLogin}
            className="flex flex-col gap-4 bg-surface p-5 rounded-2xl border border-border"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pphone" className="text-xs font-medium text-muted-foreground">
                شماره موبایل
              </label>
              <input
                id="pphone"
                type="tel"
                dir="ltr"
                placeholder="09121234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 px-3 rounded-xl border border-border bg-background text-sm font-mono text-center focus:outline-hidden focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pass" className="text-xs font-medium text-muted-foreground">
                رمز عبور
              </label>
              <input
                id="pass"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 px-3 rounded-xl border border-border bg-background text-sm text-center focus:outline-hidden focus:ring-2 focus:ring-accent"
                required
              />
              <span className="text-[11px] text-muted-foreground text-center">
                (رمز پیش‌فرض دمو: <code className="text-foreground font-bold">12345678</code>)
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {loading ? "در حال بررسی..." : "ورود با رمز عبور"}
            </button>
          </form>
        )}

        {/* TAB 3: REGISTER */}
        {tab === "register" && (
          <form
            onSubmit={handleRegister}
            className="flex flex-col gap-3 bg-surface p-5 rounded-2xl border border-border"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="rname" className="text-xs font-medium text-muted-foreground">
                نام و نام خانوادگی *
              </label>
              <input
                id="rname"
                type="text"
                placeholder="مثال: علی محمدی"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 px-3 rounded-xl border border-border bg-background text-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="rphone" className="text-xs font-medium text-muted-foreground">
                شماره موبایل *
              </label>
              <input
                id="rphone"
                type="tel"
                dir="ltr"
                placeholder="09121234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-mono text-center focus:outline-hidden focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="rcomp" className="text-xs font-medium text-muted-foreground">
                نام شرکت یا برند (اختیاری)
              </label>
              <input
                id="rcomp"
                type="text"
                placeholder="مثال: پیشگامان فناور"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="h-10 px-3 rounded-xl border border-border bg-background text-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="rpass" className="text-xs font-medium text-muted-foreground">
                رمز عبور دلخواه (اختیاری)
              </label>
              <input
                id="rpass"
                type="password"
                placeholder="حداقل ۶ کاراکتر"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 px-3 rounded-xl border border-border bg-background text-xs text-center focus:outline-hidden focus:ring-2 focus:ring-accent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer mt-1"
            >
              {loading ? "در حال ثبت‌نام..." : "تکمیل ثبت‌نام و ورود"}
            </button>
          </form>
        )}

        {/* Quick Demo Login Cards */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <span className="text-[11px] text-muted-foreground font-medium text-center">
            یا انتخاب حساب تست دمو (تک‌کلیک):
          </span>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_USERS.filter((u) => u.role === "CUSTOMER").map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleQuickDemoLogin(user)}
                className="p-2.5 rounded-xl border border-border bg-surface hover:bg-surface/60 transition-colors text-right flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="text-xs font-semibold text-foreground truncate">{user.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{user.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-2 text-[11px] text-muted-foreground">
        سامانه خدمات مشتریان گکوت وب | نسخه آزمایشی دمو
      </div>
    </div>
  );
}

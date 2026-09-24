import { useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import {
  setAdminAuthSession,
  getValidAccessToken,
  isAdminAuthenticated,
  apiClient,
} from "@/utils/api-client";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { Lock, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const token = await getValidAccessToken();
    if (token && isAdminAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();

  // Login form state (Configured for primary admin)
  const [phone, setPhone] = useState("09363528608");
  const [password, setPassword] = useState("admin@Gecut-cloud");
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("شماره موبایل و رمز عبور را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient<{
        success: boolean;
        tokens: { accessToken: string; refreshToken: string };
        user: { id: string; name: string; phone: string; role: "ADMIN" | "CUSTOMER" };
      }>("/auth/login/password", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      }).catch(async () => {
        return apiClient<{
          success: boolean;
          tokens: { accessToken: string; refreshToken: string };
          user: { id: string; name: string; phone: string; role: "ADMIN" | "CUSTOMER" };
        }>("/auth/login-password", {
          method: "POST",
          body: JSON.stringify({ phone, password }),
        });
      });

      if (res.user.role !== "ADMIN") {
        toast.error("این بخش تنها برای مدیران سیستم مجاز است. لطفاً از پنل مشتریان استفاده کنید");
        return;
      }

      setAdminAuthSession(res.tokens, res.user);
      toast.success("ورود موفقیت‌آمیز به پنل مدیریت");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message || "اطلاعات ورود مدیر نادرست است");
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
              پنل ادمین جیکات کلود
            </h1>
            <p className="relative z-10 text-xs text-white/85 font-medium mt-1 leading-relaxed">
              ورود به سامانه مدیریت زیرساخت و مالی
            </p>
          </div>

          {/* Form Body Section with Negative Border Radius Overlap */}
          <div className="-mt-6 relative z-10 rounded-t-[2rem] bg-card dark:bg-zinc-900 border-t border-emerald-500/20 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-phone"
                  className="text-xs font-semibold text-foreground/85 flex items-center justify-between"
                >
                  <span>شماره موبایل مدیر</span>
                  <span className="text-emerald-500 text-xs">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="admin-phone"
                    type="tel"
                    dir="ltr"
                    placeholder="09363528608"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-center pl-9 rounded-xl border-border/70 bg-background/50 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-xs h-11 font-mono"
                    required
                  />
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground opacity-60" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-password"
                  className="text-xs font-semibold text-foreground/85 flex items-center justify-between"
                >
                  <span>رمز عبور مدیر</span>
                  <span className="text-emerald-500 text-xs">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-center pl-9 rounded-xl border-border/70 bg-background/50 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-xs h-11 font-mono"
                    required
                  />
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground opacity-60" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl font-bold text-xs mt-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                {loading ? "در حال اعتبارسنجی..." : "ورود امن به پنل مدیریت"}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-muted-foreground/80 text-center mt-2 font-medium">
          سامانه یکپارچه مدیریت ابری جیکات وب
        </p>
      </div>
    </div>
  );
}

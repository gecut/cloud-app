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
import { Lock, Phone, User, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Ambient background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Glass Card */}
      <div className="w-full max-w-sm flex flex-col gap-5 animate-entrance">
        {/* Floating 3D Badge */}
        <div className="relative flex flex-col items-center justify-center pt-2 pb-1 select-none">
          <div className="relative flex items-center justify-center my-2 perspective-[1000px]">
            {/* Isometric Pedestal Shadow/Plate */}
            <div
              className="absolute -bottom-3 w-24 h-10 rounded-[24px] bg-gradient-to-b from-emerald-500/25 via-zinc-900/80 to-black/90 border border-emerald-500/30 shadow-[0_8px_20px_rgba(16,185,129,0.25)] blur-[0.5px]"
              style={{
                transform: "rotateX(60deg) rotateZ(0deg)",
              }}
            />

            {/* Floating Glossy 3D Badge Box */}
            <div className="relative z-10 flex items-center justify-center w-18 h-18 rounded-2xl bg-gradient-to-b from-zinc-800/90 via-zinc-900 to-black border border-emerald-500/40 shadow-[0_8px_24px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] transform hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/15 via-transparent to-white/10 pointer-events-none" />
              <img
                src="/logo.png"
                alt="Jecut Cloud"
                className="w-10 h-10 object-contain drop-shadow-[0_4px_12px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>

          <div className="text-center flex flex-col items-center gap-1 mt-3">
            <h1 className="text-xl font-black tracking-tight text-foreground">
              ورود به سامانه مدیریت
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              جهت ورود، شماره همراه و گذرواژه معتبر خود را وارد نمایید
            </p>
          </div>
        </div>

        {/* Minimalist Card Container */}
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 shadow-xl shadow-black/5 dark:shadow-black/20 flex flex-col gap-4">
          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-phone" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                <span>شماره موبایل مدیر</span>
                <span className="text-emerald-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="admin-phone"
                  type="tel"
                  dir="ltr"
                  placeholder="09363528608"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-center pl-9 rounded-xl border-border/60 bg-background/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-xs h-10 font-mono"
                  required
                />
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-60" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-password" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                <span>رمز عبور مدیر</span>
                <span className="text-emerald-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center pl-9 rounded-xl border-border/60 bg-background/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-xs h-10 font-mono"
                  required
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-60" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl font-semibold text-xs mt-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              {loading ? "در حال اعتبارسنجی..." : "ورود امن به پنل مدیریت"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

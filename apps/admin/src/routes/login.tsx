import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DEMO_USERS, setActiveUser, type DemoUser } from "@/utils/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { ShieldCheck, User, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();

  const handleLoginAs = (user: DemoUser) => {
    setActiveUser(user);
    toast.success(`با موفقیت به عنوان ${user.name} وارد شدید`);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-xl mb-2">
            GC
          </div>
          <CardTitle className="text-xl font-bold">ورود به گکوت کلود</CardTitle>
          <CardDescription className="text-xs mt-1">
            جهت تست سریع قابلیت‌ها، نقش مورد نظر خود را انتخاب کنید
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {DEMO_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => handleLoginAs(user)}
              className="flex items-center justify-between p-4 rounded-xl border bg-background hover:bg-muted/50 hover:border-primary/50 transition-all text-right group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    user.role === "ADMIN"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {user.role === "ADMIN" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{user.email}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-[-4px] transition-all rotate-180" />
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


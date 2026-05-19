import { ORPCError } from "@orpc/client";
import { Button, Card, Form, Input, Label, TextField, toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Login3 } from "@solar-icons/react-perf/Linear";

import { loginMutationOptions } from "@/modules/auth/api/auth.mutations";
import { AuthErrorState } from "@/modules/auth/states/auth-error-state";
import type { RouterAppContext } from "@/routes/__root";

interface LoginPageProps {
  routeContext: Pick<RouterAppContext, "orpc" | "queryClient">;
}

export function LoginPage({ routeContext }: LoginPageProps) {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    ...loginMutationOptions(routeContext),
    onSuccess: async (...args) => {
      await loginMutationOptions(routeContext).onSuccess?.(...args);
      toast.success("با موفقیت وارد شدید");
      await navigate({ to: "/" });
    },
    onError: (error) => {
      toast.danger("ورود ناموفق بود", {
        description: getLoginErrorMessage(error),
      });
    },
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phone = normalizePhoneInput(formData.get("phone")?.toString() ?? "");
    const password = formData.get("password")?.toString() ?? "";

    if (!phone || !password) {
      toast.warning("شماره موبایل و رمز عبور را وارد کنید");
      return;
    }

    loginMutation.mutate({ phone, password });
  };

  return (
    <main className="flex-1 size-full flex p-6 items-center justify-center">
      <Card className="w-full max-w-md p-6 overflow-visible">
        <Card.Header className="mb-6">
          <div className="p-6 bg-surface rounded-full mx-auto -mt-16">
            <Login3 className="size-10 text-accent" />
          </div>

          <Card.Title className="text-xl">ورود به ابر جیکات‌وب</Card.Title>
          <Card.Description className="text-sm mt-2">
            اطلاعات خود را وارد کنید تا به ابر جیکات‌وب دسترسی پیدا کنید
          </Card.Description>
        </Card.Header>
        <Form onSubmit={onSubmit}>
          <Card.Content>
            <div className="flex flex-col gap-4">
              <TextField name="phone" type="tel">
                <Label>شماره موبایل</Label>
                <Input dir="ltr" placeholder="0912 345 6789" className="h-12" variant="secondary" />
              </TextField>
              <TextField name="password" type="password">
                <Label>رمز عبور</Label>
                <Input dir="ltr" className="h-12" placeholder="••••••••" variant="secondary" />
              </TextField>
            </div>
          </Card.Content>
          <Card.Footer className="mt-6 flex flex-col gap-2">
            {loginMutation.isError ? <AuthErrorState message={getLoginErrorMessage(loginMutation.error)} /> : null}
            <Button className="w-full h-12" size="lg" type="submit" isDisabled={loginMutation.isPending}>
              {loginMutation.isPending ? "در حال ورود..." : "ورود"}
            </Button>
          </Card.Footer>
        </Form>
      </Card>
    </main>
  );
}

function normalizePhoneInput(raw: string) {
  return raw.trim().replace(/\s+/g, "");
}

function getLoginErrorMessage(error: unknown): string {
  if (
    error instanceof ORPCError &&
    error.data &&
    typeof error.data === "object" &&
    "safeUserMessage" in error.data &&
    typeof error.data.safeUserMessage === "string"
  ) {
    return error.data.safeUserMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "خطایی در فرآیند ورود رخ داد";
}

import { ORPCError } from "@orpc/server";

import type { Context } from "../context";

export function requireAuth(context: Context) {
  if (!context.session || !context.user) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Authentication required",
      data: {
        code: "AUTH_UNAUTHORIZED",
        safeUserMessage: "برای ادامه باید وارد حساب کاربری شوید",
      },
    });
  }

  return {
    session: context.session,
    user: context.user,
  };
}

export function requireAdmin(context: Context) {
  const auth = requireAuth(context);

  if (auth.session.role !== "ADMIN") {
    throw new ORPCError("FORBIDDEN", {
      message: "Admin role required",
      data: {
        code: "AUTH_FORBIDDEN",
        safeUserMessage: "دسترسی شما به این بخش مجاز نیست",
      },
    });
  }

  return auth;
}

export function requireCustomer(context: Context) {
  const auth = requireAuth(context);

  if (auth.session.role !== "CUSTOMER" || !auth.session.customerId) {
    throw new ORPCError("FORBIDDEN", {
      message: "Customer role required",
      data: {
        code: "AUTH_FORBIDDEN",
        safeUserMessage: "دسترسی شما به این بخش مجاز نیست",
      },
    });
  }

  return auth as typeof auth & { session: typeof auth.session & { customerId: string } };
}

export function requireTenantOwnership(context: Context, customerId: string) {
  const auth = requireCustomer(context);

  if (auth.session.customerId !== customerId) {
    throw new ORPCError("FORBIDDEN", {
      message: "Tenant isolation violation",
      data: {
        code: "TENANT_ACCESS_DENIED",
        safeUserMessage: "شما به داده‌های این مشتری دسترسی ندارید",
      },
    });
  }

  return auth;
}

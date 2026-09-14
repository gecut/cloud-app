import { env } from "@gecut-cloud/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface DemoUser {
  id: string;
  role: "ADMIN" | "CUSTOMER";
  name: string;
  email: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "admin_1",
    role: "ADMIN",
    name: "مدیر ارشد سیستم (ادمین)",
    email: "admin@gecut.cloud",
  },
  {
    id: "cust_1",
    role: "CUSTOMER",
    name: "شرکت چوبینو (مشتری نمونه)",
    email: "info@choobinooo.ir",
  },
  {
    id: "cust_2",
    role: "CUSTOMER",
    name: "آژانس دیجیتال رایان",
    email: "contact@rayan.agency",
  },
];

export function getActiveUser(): DemoUser {
  if (typeof window === "undefined") return DEMO_USERS[0];
  const stored = localStorage.getItem("gecut_active_user");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return DEMO_USERS[0];
}

export function setActiveUser(user: DemoUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem("gecut_active_user", JSON.stringify(user));
  localStorage.setItem("gecut_demo_role", user.role);
  localStorage.setItem("gecut_demo_user_id", user.id);
  window.dispatchEvent(new Event("auth-change"));
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(`خطا در درخواست: ${error.message}`, {
        action: {
          label: "تلاش مجدد",
          onClick: query.invalidate,
        },
      });
    },
  }),
});

export const API_BASE_URL = env.VITE_SERVER_URL;

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const activeUser = getActiveUser();
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-role": activeUser.role,
      "x-user-id": activeUser.id,
      ...options.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || `درخواست با کد وضعیت ${res.status} ناموفق بود`,
    );
  }

  return res.json();
}

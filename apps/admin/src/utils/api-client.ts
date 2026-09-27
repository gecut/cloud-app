import { env } from "@gecut-cloud/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface DemoUser {
  id: string;
  role: "ADMIN" | "CUSTOMER";
  name: string;
  email: string;
  phone?: string;
}

export const DEMO_USERS: DemoUser[] = [];

const ACCESS_TOKEN_KEY = "gecut_admin_access_token";
const REFRESH_TOKEN_KEY = "gecut_admin_refresh_token";
const AUTH_USER_KEY = "gecut_admin_user";
const LEGACY_USER_KEY = "gecut_active_user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem("gecut_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem("gecut_refresh_token");
}

export function getAuthUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem("gecut_user");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return null;
}

export function setAdminAuthSession(
  tokens: { accessToken: string; refreshToken: string },
  user?: any,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  if (user) {
    const formattedUser: DemoUser = {
      id: user.id || "admin_1",
      name: user.name || "مدیر سامانه",
      phone: user.phone || "",
      email: user.email || "admin@gecut.cloud",
      role: user.role || "ADMIN",
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(formattedUser));
    localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(formattedUser));
    localStorage.setItem("gecut_demo_role", formattedUser.role);
    localStorage.setItem("gecut_demo_user_id", formattedUser.id);
  }
  window.dispatchEvent(new Event("auth-change"));
}

export function clearAdminAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
  localStorage.removeItem("gecut_demo_role");
  localStorage.removeItem("gecut_demo_user_id");
  window.dispatchEvent(new Event("auth-change"));
}

export function getActiveUser(): DemoUser {
  const user = getAuthUser();
  if (user) return user;
  if (typeof window === "undefined") return DEMO_USERS[0];
  const stored = localStorage.getItem(LEGACY_USER_KEY);
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
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem("gecut_demo_role", user.role);
  localStorage.setItem("gecut_demo_user_id", user.id);

  // Generate demo session tokens so protected routes allow immediate access in demo mode
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 86400 * 7;
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      phone: user.phone || "09120000001",
      role: user.role,
      tokenVersion: 0,
      type: "access",
      exp,
    }),
  );
  const demoToken = `${header}.${payload}.demo_sig`;
  localStorage.setItem(ACCESS_TOKEN_KEY, demoToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, demoToken);

  window.dispatchEvent(new Event("auth-change"));
}

/**
 * Checks if a JWT token has expired or will expire within bufferSeconds.
 */
export function isTokenExpired(token: string, bufferSeconds = 15): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return true;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    const payload = JSON.parse(json);
    if (!payload.exp) return false;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowInSeconds + bufferSeconds;
  } catch {
    return true;
  }
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAdminToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAdminAuth();
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const url = `${API_BASE_URL}/auth/refresh-token`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        throw new Error("نشست منقضی شده است");
      }

      const data = await res.json();
      if (data?.tokens?.accessToken && data?.tokens?.refreshToken) {
        setAdminAuthSession(data.tokens, getAuthUser());
        return data.tokens.accessToken as string;
      }
      throw new Error("ساختار توکن جدید نامعتبر است");
    } catch {
      clearAdminAuth();
      if (typeof window !== "undefined") {
        if (!window.location.pathname.includes("/login")) {
          toast.error("نشست کاربری مدیر منقضی شده است. لطفاً دوباره وارد شوید");
        }
        window.dispatchEvent(new CustomEvent("gecut-auth-expired"));
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token && !isTokenExpired(token)) {
    return token;
  }

  const refreshToken = getRefreshToken();
  if (refreshToken) {
    return refreshAdminToken();
  }

  return null;
}

export function isAdminAuthenticated(): boolean {
  const user = getAuthUser();
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!token && !refreshToken) return false;
  if (user && user.role !== "ADMIN") return false;
  return true;
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

export const API_BASE_URL = (() => {
  const configured = env.VITE_SERVER_URL;
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (
      !isLocalhost &&
      (configured.includes("localhost") || configured.includes("127.0.0.1"))
    ) {
      return "https://api.app.gecut.ir";
    }
  }
  return configured;
})();

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const validToken = await getValidAccessToken();
  const activeUser = getActiveUser();
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (validToken) {
    headers["Authorization"] = `Bearer ${validToken}`;
  }

  if (activeUser?.role) {
    headers["x-user-role"] = activeUser.role;
  }
  if (activeUser?.id) {
    headers["x-user-id"] = activeUser.id;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !isRetry && getRefreshToken()) {
    const refreshedToken = await refreshAdminToken();
    if (refreshedToken) {
      return apiClient<T>(endpoint, options, true);
    }
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    let errorMessage = `درخواست با کد وضعیت ${res.status} ناموفق بود`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) errorMessage = parsed.message;
    } catch {}
    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const text = await res.text().catch(() => "");
  if (!text || text.trim() === "") {
    return {} as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {} as T;
  }
}

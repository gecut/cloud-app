import { env } from "@gecut-cloud/env/web";
import { toast } from "@heroui/react";
import { QueryCache, QueryClient } from "@tanstack/react-query";

export interface DemoUser {
  id: string;
  role: "ADMIN" | "CUSTOMER";
  name: string;
  email: string;
  phone?: string;
  customerId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

export const DEMO_USERS: DemoUser[] = [];

const ACCESS_TOKEN_KEY = "gecut_access_token";
const REFRESH_TOKEN_KEY = "gecut_refresh_token";
const AUTH_USER_KEY = "gecut_user";
const LEGACY_USER_KEY = "gecut_active_user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAuthUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return null;
}

export function setAuthSession(
  tokens: { accessToken: string; refreshToken: string },
  user?: any,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  if (user) {
    const formattedUser: DemoUser = {
      id: user.id || "cust_user",
      name: user.name || "کاربر جیکات",
      phone: user.phone || "",
      email: user.email || `${user.phone || "user"}@gecut.cloud`,
      role: user.role || "CUSTOMER",
      customerId: user.customerId || null,
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(formattedUser));
    localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(formattedUser));
    localStorage.setItem("gecut_demo_role", formattedUser.role);
    localStorage.setItem("gecut_demo_user_id", formattedUser.id);
  }
  window.dispatchEvent(new Event("auth-change"));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
  localStorage.removeItem("gecut_demo_role");
  localStorage.removeItem("gecut_demo_user_id");
  window.dispatchEvent(new Event("auth-change"));
}

export function getActiveCustomerUser(): DemoUser {
  const user = getAuthUser();
  if (user) return user;
  if (typeof window === "undefined") {
    return {
      id: "",
      role: "CUSTOMER",
      name: "",
      email: "",
    };
  }
  const stored = localStorage.getItem(LEGACY_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return {
    id: "",
    role: "CUSTOMER",
    name: "کاربر",
    email: "",
  };
}

export function setActiveCustomerUser(user: DemoUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem("gecut_demo_role", user.role);
  localStorage.setItem("gecut_demo_user_id", user.id);
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

// Single-flight promise lock for refresh token calls to avoid concurrent duplicate requests
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuth();
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
        setAuthSession(data.tokens, getAuthUser());
        return data.tokens.accessToken as string;
      }
      throw new Error("ساختار توکن جدید نامعتبر است");
    } catch {
      clearAuth();
      if (typeof window !== "undefined") {
        if (!window.location.pathname.includes("/login")) {
          toast.danger("نشست کاربری شما منقضی شد. لطفاً دوباره وارد شوید");
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

/**
 * Returns a valid access token. If expired, attempts auto-refresh using refresh token.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token && !isTokenExpired(token)) {
    return token;
  }

  const refreshToken = getRefreshToken();
  if (refreshToken) {
    return refreshAccessToken();
  }

  return null;
}

export async function validateSession(): Promise<boolean> {
  const rawToken = getAccessToken();
  const rawRefreshToken = getRefreshToken();
  if (!rawToken && !rawRefreshToken) {
    return false;
  }

  const token = await getValidAccessToken();
  if (!token) {
    clearAuth();
    return false;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const userData = data?.user || data;
      if (userData?.id) {
        const currentUser: DemoUser = {
          id: userData.id,
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          role: userData.role,
          customerId: userData.customerId || null,
        };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
        localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(currentUser));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-change"));
        }
        return true;
      }
    }

    if (res.status === 401) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        const retryRes = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshedToken}`,
          },
        });
        if (retryRes.ok) {
          const data = await retryRes.json();
          const userData = data?.user || data;
          if (userData?.id) {
            const currentUser: DemoUser = {
              id: userData.id,
              name: userData.name,
              phone: userData.phone,
              email: userData.email,
              role: userData.role,
              customerId: userData.customerId || null,
            };
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
            localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(currentUser));
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("auth-change"));
            }
            return true;
          }
        }
      }
    }

    clearAuth();
    return false;
  } catch {
    // If server is offline/unreachable due to network, rely on local token expiration
    return !isTokenExpired(token);
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!token && !refreshToken) return false;
  if (token && !isTokenExpired(token)) return true;
  return !!refreshToken;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.danger("درخواست ناموفق بود", {
        actionProps: {
          children: "تلاش مجدد",
          onPress: query.invalidate,
          variant: "tertiary",
        },
        description: error.message,
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
  const isAuthEndpoint =
    endpoint.includes("/auth/otp/") ||
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/send-otp") ||
    endpoint.includes("/auth/verify-otp") ||
    endpoint.includes("/auth/refresh-token") ||
    endpoint.includes("/auth/register");

  const validToken = isAuthEndpoint ? null : await getValidAccessToken();
  const activeUser = getActiveCustomerUser();
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

  if (res.status === 401 && !isRetry && !isAuthEndpoint && getRefreshToken()) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return apiClient<T>(endpoint, options, true);
    }
  }

  if (res.status === 204) {
    return {} as T;
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || `درخواست با کد وضعیت ${res.status} ناموفق بود`,
    );
  }

  const text = await res.text();
  if (!text || text.trim() === "") {
    return {} as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

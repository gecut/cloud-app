export type UserRole = "ADMIN" | "CUSTOMER";

export interface JwtPayload {
  sub: string;
  phone: string;
  role: UserRole;
  customerId?: string | null;
  tokenVersion: number;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  customerId?: string | null;
  tokenVersion: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface AuthResponse {
  success: boolean;
  tokens: AuthTokens;
  user: AuthenticatedUser;
  message: string;
}

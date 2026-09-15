import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  AuthTokens,
  AuthenticatedUser,
  JwtPayload,
} from "../types/authenticated-user.type";

@Injectable()
export class TokenService {
  private readonly jwtSecret: string =
    process.env.JWT_SECRET || "gecut-cloud-super-secure-production-jwt-secret-key-2026";
  private readonly accessTokenTtlSeconds: number = parseInt(
    process.env.JWT_ACCESS_EXPIRATION || "2592000",
    10,
  ); // 30 days (1 month)
  private readonly refreshTokenTtlSeconds: number = parseInt(
    process.env.JWT_REFRESH_EXPIRATION || "7776000",
    10,
  ); // 90 days (3 months)

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    return Buffer.from(base64, "base64").toString("utf-8");
  }

  private sign(header: object, payload: object): string {
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const signature = createHmac("sha256", this.jwtSecret)
      .update(dataToSign)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    return `${dataToSign}.${signature}`;
  }

  public verifyToken(
    token: string,
    expectedType: "access" | "refresh" = "access",
  ): JwtPayload {
    if (!token || typeof token !== "string") {
      throw new UnauthorizedException("توکن ارائه نشده است");
    }

    const parts = token.split(".");
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      throw new UnauthorizedException("فرمت توکن نامعتبر است");
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = createHmac("sha256", this.jwtSecret)
      .update(dataToVerify)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    try {
      const sigBuf = Buffer.from(signature, "utf-8");
      const expBuf = Buffer.from(expectedSignature, "utf-8");
      if (
        sigBuf.length !== expBuf.length ||
        !timingSafeEqual(sigBuf, expBuf)
      ) {
        throw new UnauthorizedException("امضای توکن نامعتبر است");
      }
    } catch {
      throw new UnauthorizedException("امضای توکن نامعتبر است");
    }

    let payload: JwtPayload;
    try {
      payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as JwtPayload;
    } catch {
      throw new UnauthorizedException("اطلاعات توکن قابل رمزگشایی نیست");
    }

    // Validate expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException("توکن منقضی شده است");
    }

    // Validate token type
    if (payload.type !== expectedType) {
      throw new UnauthorizedException(
        `نوع توکن نامعتبر است (انتظار می‌رود: ${expectedType})`,
      );
    }

    return payload;
  }

  public generateAuthTokens(user: AuthenticatedUser): AuthTokens {
    const now = Math.floor(Date.now() / 1000);

    const accessPayload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      customerId: user.customerId,
      tokenVersion: user.tokenVersion,
      type: "access",
      iat: now,
      exp: now + this.accessTokenTtlSeconds,
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      customerId: user.customerId,
      tokenVersion: user.tokenVersion,
      type: "refresh",
      iat: now,
      exp: now + this.refreshTokenTtlSeconds,
    };

    const header = { alg: "HS256", typ: "JWT" };

    const accessToken = this.sign(header, accessPayload);
    const refreshToken = this.sign(header, refreshPayload);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenTtlSeconds,
      tokenType: "Bearer",
    };
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@gecut-cloud/env/server";

import { AppError } from "../utils/errors";

export type SessionClaims = {
  userId: string;
  role: "ADMIN" | "CUSTOMER";
  customerId?: string;
  tokenVersion: number;
  exp: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payloadPart: string) {
  return createHmac("sha256", env.SESSION_SECRET).update(payloadPart).digest("base64url");
}

export function createSessionToken(claims: Omit<SessionClaims, "exp">) {
  const exp = Math.floor(Date.now() / 1000) + env.SESSION_TTL_SECONDS;
  const payload = JSON.stringify({ ...claims, exp });
  const payloadPart = toBase64Url(payload);
  const signature = sign(payloadPart);

  return `${payloadPart}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionClaims | null {
  if (!token) {
    return null;
  }

  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expected = sign(payloadPart);

  const isEqual =
    signaturePart.length === expected.length &&
    timingSafeEqual(Buffer.from(signaturePart), Buffer.from(expected));

  if (!isEqual) {
    return null;
  }

  try {
    const claims = JSON.parse(fromBase64Url(payloadPart)) as SessionClaims;

    if (claims.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

export function requireSessionClaims(claims: SessionClaims | null) {
  if (!claims) {
    throw new AppError("AUTH_UNAUTHORIZED", "Authentication required", "برای ادامه باید وارد حساب کاربری شوید");
  }

  return claims;
}

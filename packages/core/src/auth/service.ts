import prisma from "@gecut-cloud/db";

import type { SessionClaims } from "./session";
import { createSessionToken } from "./session";
import { hashPassword, verifyPassword } from "./password";
import { AppError, assertOrThrow } from "../utils/errors";

export async function loginWithPhonePassword(phone: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      customer: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    throw new AppError("AUTH_INVALID_CREDENTIALS", "User not found", "شماره تلفن یا رمز عبور نادرست است");
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError("AUTH_INVALID_CREDENTIALS", "Password mismatch", "شماره تلفن یا رمز عبور نادرست است");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
    include: {
      customer: {
        select: { id: true },
      },
    },
  });

  const claims: Omit<SessionClaims, "exp"> = {
    userId: updatedUser.id,
    role: updatedUser.role,
    customerId: updatedUser.customer?.id,
    tokenVersion: updatedUser.tokenVersion,
  };

  return {
    token: createSessionToken(claims),
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      role: updatedUser.role,
      customerId: updatedUser.customer?.id,
    },
  };
}

export async function resolveSessionUser(claims: SessionClaims) {
  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    include: {
      customer: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    return null;
  }

  if (user.tokenVersion !== claims.tokenVersion) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    customerId: user.customer?.id,
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  assertOrThrow(user, "RESOURCE_NOT_FOUND", "User not found", "کاربر موردنظر یافت نشد");

  const isValidCurrent = await verifyPassword(currentPassword, user.passwordHash);

  if (!isValidCurrent) {
    throw new AppError("AUTH_INVALID_CREDENTIALS", "Current password is invalid", "رمز عبور فعلی صحیح نیست");
  }

  const nextHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: nextHash,
      tokenVersion: {
        increment: 1,
      },
    },
  });

  return { success: true };
}

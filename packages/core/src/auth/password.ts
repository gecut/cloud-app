import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { AppError } from "../utils/errors";

const scrypt = promisify(scryptCallback);
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  if (!passwordHash) {
    throw new AppError("AUTH_INVALID_CREDENTIALS", "User has no password hash", "شماره تلفن یا رمز عبور نادرست است");
  }

  // Backward-compatible verification for Bun native password hashes used in seed data.
  if (passwordHash.startsWith("$")) {
    const bunApi = (globalThis as { Bun?: { password?: { verify?: (plain: string, hash: string) => Promise<boolean> } } }).Bun;

    if (!bunApi?.password?.verify) {
      return false;
    }

    return bunApi.password.verify(password, passwordHash);
  }

  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
}

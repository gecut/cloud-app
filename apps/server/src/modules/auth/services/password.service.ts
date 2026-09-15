import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

@Injectable()
export class PasswordService {
  private readonly keyLength = 64;

  /**
   * Hashes a plain password with a secure cryptographic salt using scrypt.
   * Returns format: `salt:derivedKeyHex`
   */
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(
      password,
      salt,
      this.keyLength,
    )) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  /**
   * Verifies a candidate password against the stored hash in constant time.
   */
  async compare(password: string, storedHash: string): Promise<boolean> {
    if (!storedHash || !password) {
      return false;
    }

    // Handle standard salt:hash format
    if (storedHash.includes(":")) {
      const [salt, key] = storedHash.split(":");
      if (!salt || !key) {
        return false;
      }

      try {
        const keyBuffer = Buffer.from(key, "hex");
        const derivedKey = (await scryptAsync(
          password,
          salt,
          this.keyLength,
        )) as Buffer;
        return timingSafeEqual(keyBuffer, derivedKey);
      } catch {
        return false;
      }
    }

    // Plain text check only if hash is not yet converted to scrypt
    return password === storedHash;
  }
}

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { JWT_COOKIE_NAME } from "@/lib/constants";
import type { SessionUser } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

interface TokenPayload {
  user: SessionUser;
  iat?: number;
  exp?: number;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function createSessionToken(user: SessionUser): string {
  return jwt.sign({ user }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded.user;
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

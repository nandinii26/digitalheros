import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import type { SessionUser, UserRole } from "@/lib/types";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function badRequest(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function requireSession(role?: UserRole): Promise<SessionUser | NextResponse> {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("Unauthorized", 401);
  }
  if (role && session.role !== role) {
    return badRequest("Forbidden", 403);
  }
  return session;
}

export async function parseJson<T>(request: NextRequest): Promise<T> {
  return (await request.json()) as T;
}

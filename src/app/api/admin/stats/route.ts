import { NextResponse } from "next/server";
import { ok, requireSession } from "@/lib/api";
import { getAdminStats, listUsers } from "@/lib/store";

export async function GET() {
  const session = await requireSession("admin");
  if (session instanceof NextResponse) {
    return session;
  }

  return ok({ stats: getAdminStats(), users: listUsers() });
}

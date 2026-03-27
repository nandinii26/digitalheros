import { NextResponse } from "next/server";
import { ok, requireSession } from "@/lib/api";
import { getUserDashboard } from "@/lib/store";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }

  return ok({ dashboard: getUserDashboard(session.id) });
}

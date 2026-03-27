import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, ok, parseJson, requireSession } from "@/lib/api";
import { getSubscription, updateSubscription } from "@/lib/store";

const schema = z.object({
  plan: z.enum(["monthly", "yearly"]).optional(),
  charityId: z.string().optional(),
  charityPercent: z.number().min(10).max(100).optional(),
});

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }
  return ok({ subscription: getSubscription(session.id) });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = schema.parse(await parseJson(request));
    return ok({ subscription: updateSubscription(session.id, body) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return badRequest(message);
  }
}

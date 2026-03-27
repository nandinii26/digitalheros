import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, ok, parseJson, requireSession } from "@/lib/api";
import { listWinners, updateWinner } from "@/lib/store";

const schema = z.object({
  id: z.string(),
  proofUrl: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  payoutStatus: z.enum(["pending", "paid"]).optional(),
});

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }

  if (session.role === "admin") {
    return ok({ winners: listWinners() });
  }
  return ok({ winners: listWinners(session.id) });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = schema.parse(await parseJson(request));

    if (session.role !== "admin" && (body.status || body.payoutStatus)) {
      return badRequest("Only admins can review winners or mark payouts", 403);
    }

    const winner = updateWinner(body.id, {
      proofUrl: body.proofUrl,
      status: body.status,
      payoutStatus: body.payoutStatus,
      reviewedBy: session.role === "admin" ? session.id : undefined,
    });

    return ok({ winner });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return badRequest(message);
  }
}

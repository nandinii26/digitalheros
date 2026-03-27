import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, ok, parseJson, requireSession } from "@/lib/api";
import { listDraws, runDraw } from "@/lib/store";

const schema = z.object({
  mode: z.enum(["random", "algorithmic"]),
  simulate: z.boolean(),
});

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }

  return ok({ draws: listDraws() });
}

export async function POST(request: NextRequest) {
  const session = await requireSession("admin");
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = schema.parse(await parseJson(request));
    return ok(runDraw({ mode: body.mode, simulate: body.simulate, userId: session.id }), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return badRequest(message);
  }
}

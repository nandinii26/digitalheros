import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, ok, parseJson, requireSession } from "@/lib/api";
import { addScore, editScore, getUserScores } from "@/lib/store";

const createSchema = z.object({
  value: z.number().int(),
  date: z.string().min(10),
});

const editSchema = z.object({
  id: z.string(),
  value: z.number().int(),
  date: z.string().min(10),
});

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }
  return ok({ scores: getUserScores(session.id) });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = createSchema.parse(await parseJson(request));
    return ok({ scores: addScore(session.id, body.value, body.date) }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return badRequest(message);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = editSchema.parse(await parseJson(request));
    return ok({ scores: editScore(session.id, body.id, body.value, body.date) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return badRequest(message);
  }
}

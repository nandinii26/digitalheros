import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, ok, parseJson, requireSession } from "@/lib/api";
import { listCharities, upsertCharity } from "@/lib/store";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().min(5),
  imageUrl: z.string().optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  events: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || undefined;
  return ok({ charities: listCharities(search) });
}

export async function POST(request: NextRequest) {
  const session = await requireSession("admin");
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = schema.parse(await parseJson(request));
    const charity = upsertCharity(body);
    return ok({ charity }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return badRequest(message);
  }
}

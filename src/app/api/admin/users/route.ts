import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, ok, parseJson, requireSession } from "@/lib/api";
import {
  editScore,
  getAllScores,
  getAllSubscriptions,
  listUsers,
  updateSubscription,
  updateUserProfile,
} from "@/lib/store";

const schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("user"),
    userId: z.string(),
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(["subscriber", "admin"]).optional(),
  }),
  z.object({
    type: z.literal("subscription"),
    userId: z.string(),
    plan: z.enum(["monthly", "yearly"]).optional(),
    status: z.enum(["active", "inactive", "lapsed", "cancelled"]).optional(),
    charityId: z.string().optional(),
    charityPercent: z.number().min(10).max(100).optional(),
  }),
  z.object({
    type: z.literal("score"),
    userId: z.string(),
    scoreId: z.string(),
    value: z.number().int().min(1).max(45),
    date: z.string().min(10),
  }),
]);

export async function GET() {
  const session = await requireSession("admin");
  if (session instanceof NextResponse) {
    return session;
  }

  return ok({
    users: listUsers(),
    subscriptions: getAllSubscriptions(),
    scores: getAllScores(),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession("admin");
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = schema.parse(await parseJson(request));

    if (body.type === "user") {
      return ok({ user: updateUserProfile(body.userId, body) });
    }

    if (body.type === "subscription") {
      return ok({ subscription: updateSubscription(body.userId, body) });
    }

    return ok({ scores: editScore(body.userId, body.scoreId, body.value, body.date) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return badRequest(message);
  }
}

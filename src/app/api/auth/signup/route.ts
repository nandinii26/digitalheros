import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken } from "@/lib/auth";
import { JWT_COOKIE_NAME, MIN_CHARITY_PERCENT } from "@/lib/constants";
import { badRequest, parseJson } from "@/lib/api";
import { signupUser } from "@/lib/store";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  plan: z.enum(["monthly", "yearly"]),
  charityId: z.string().min(2),
  charityPercent: z.number().min(MIN_CHARITY_PERCENT).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await parseJson(request));
    const user = signupUser(body);
    const token = createSessionToken(user);

    const response = NextResponse.json({ ok: true, data: user }, { status: 201 });
    response.cookies.set(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return badRequest(message);
  }
}

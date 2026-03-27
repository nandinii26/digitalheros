import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken } from "@/lib/auth";
import { JWT_COOKIE_NAME } from "@/lib/constants";
import { badRequest, parseJson } from "@/lib/api";
import { loginUser } from "@/lib/store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await parseJson(request));
    const user = loginUser(body.email, body.password);
    const token = createSessionToken(user);

    const response = NextResponse.json({ ok: true, data: user });
    response.cookies.set(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid credentials";
    return badRequest(message, 401);
  }
}

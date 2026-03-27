import { ok } from "@/lib/api";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookies();
  return ok({ session });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PLAN_PRICING } from "@/lib/constants";
import { badRequest, parseJson, requireSession } from "@/lib/api";
import { stripe } from "@/lib/stripe";

const schema = z.object({
  plan: z.enum(["monthly", "yearly"]),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }

  if (!stripe) {
    return badRequest("Stripe is not configured", 500);
  }

  try {
    const body = schema.parse(await parseJson(request));

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Birdie for Good ${body.plan} plan`,
            },
            recurring: {
              interval: body.plan === "monthly" ? "month" : "year",
            },
            unit_amount: Math.round(PLAN_PRICING[body.plan] * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=cancelled`,
      metadata: {
        userId: session.id,
        plan: body.plan,
      },
    });

    return NextResponse.json({ ok: true, data: { url: checkout.url } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment session creation failed";
    return badRequest(message);
  }
}

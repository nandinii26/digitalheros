import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PLAN_PRICING } from "@/lib/constants";
import { badRequest, parseJson, requireSession } from "@/lib/api";
import { stripe } from "@/lib/stripe";
import { getSubscription } from "@/lib/store";

const schema = z.object({
  plan: z.enum(["monthly", "yearly"]),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = schema.parse(await parseJson(request));
    const subscription = getSubscription(session.id);

    if (!subscription) {
      return badRequest("Subscription profile not found", 404);
    }

    if (!stripe) {
      return badRequest("Stripe is not configured. Set STRIPE_SECRET_KEY, NEXT_PUBLIC_APP_URL, and STRIPE_WEBHOOK_SECRET.", 500);
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(subscription.stripeCustomerId ? { customer: subscription.stripeCustomerId } : { customer_email: session.email }),
      client_reference_id: session.id,
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
      metadata: {
        userId: session.id,
        plan: body.plan,
      },
      subscription_data: {
        metadata: {
          userId: session.id,
          plan: body.plan,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=cancelled`,
    });

    if (!checkout.url) {
      return badRequest("Unable to create Stripe checkout session", 500);
    }

    return NextResponse.json({ ok: true, data: { url: checkout.url } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment session creation failed";
    return badRequest(message);
  }
}

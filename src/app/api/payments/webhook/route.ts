import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { activateSubscriptionFromCheckout, syncSubscriptionFromStripe } from "@/lib/store";

export const runtime = "nodejs";

function parsePlan(plan?: string | null): "monthly" | "yearly" | undefined {
  if (plan === "monthly" || plan === "yearly") {
    return plan;
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "Stripe webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe signature" }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      const checkout = event.data.object as Stripe.Checkout.Session;
      const userId = checkout.metadata?.userId;
      const plan = parsePlan(checkout.metadata?.plan);

      if (userId && plan) {
        let renewalDate: string | undefined;
        let stripeSubscriptionId: string | undefined;

        if (typeof checkout.subscription === "string") {
          stripeSubscriptionId = checkout.subscription;
          const stripeSubscription = await stripe.subscriptions.retrieve(checkout.subscription);
          renewalDate = new Date(stripeSubscription.current_period_end * 1000).toISOString();
        }

        activateSubscriptionFromCheckout({
          userId,
          plan,
          stripeCustomerId: typeof checkout.customer === "string" ? checkout.customer : undefined,
          stripeSubscriptionId,
          renewalDate,
        });
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      syncSubscriptionFromStripe({
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : undefined,
        stripeStatus: subscription.status,
        interval: subscription.items.data[0]?.price.recurring?.interval,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        userId: subscription.metadata?.userId,
      });
    }

    if (event.type === "invoice.payment_failed" || event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      if (typeof invoice.subscription === "string") {
        const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
        syncSubscriptionFromStripe({
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: typeof stripeSubscription.customer === "string" ? stripeSubscription.customer : undefined,
          stripeStatus: event.type === "invoice.paid" ? "active" : "past_due",
          interval: stripeSubscription.items.data[0]?.price.recurring?.interval,
          currentPeriodEnd: stripeSubscription.current_period_end,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          userId: stripeSubscription.metadata?.userId,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

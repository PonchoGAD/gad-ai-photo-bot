// packages/billing/src/webhooks/stripe.webhook.ts
import Stripe from "stripe";
import { credit } from "../ledger.js";
import { PLANS } from "../plans.js";
import type { Request, Response } from "express";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover"
});

/**
 * Stripe webhook (RAW BODY REQUIRED)
 */
export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("Missing stripe-signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ----------------------------
  // checkout.session.completed
  // ----------------------------
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const subscriptionId = session.subscription as string | null;

    if (!userId || !subscriptionId) {
      console.warn("Stripe session missing metadata");
      return res.json({ received: true });
    }

    // 🔒 Idempotency key = subscriptionId + sessionId
    const idempotencyKey = `stripe:${subscriptionId}:${session.id}`;

    // Пример: PRO (можно расширить)
    await credit({
      userId,
      amount: PLANS.PRO.monthlyCredits,
      reason: "STRIPE_SUBSCRIPTION_PRO",
      meta: {
        stripeSessionId: session.id,
        stripeSubscriptionId: subscriptionId,
        idempotencyKey
      }
    });
  }

  res.json({ received: true });
}

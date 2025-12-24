import { stripe } from "../providers/stripe.js";
import { addCredits } from "../ledger.js";
import { PLANS } from "../plans.js";
export async function stripeWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata.userId;
        // Пример: PRO
        await addCredits(userId, PLANS.PRO.monthlyCredits, "Stripe subscription");
    }
    res.json({ received: true });
}
//# sourceMappingURL=stripe.webhook.js.map
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export async function createCheckoutSession(userId, priceId) {
    return stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { userId },
        success_url: "https://your-domain/success",
        cancel_url: "https://your-domain/cancel"
    });
}
//# sourceMappingURL=stripe.js.map
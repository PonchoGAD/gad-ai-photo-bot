import Stripe from "stripe";
export declare const stripe: Stripe;
export declare function createCheckoutSession(userId: string, priceId: string): Promise<Stripe.Response<Stripe.Checkout.Session>>;
//# sourceMappingURL=stripe.d.ts.map
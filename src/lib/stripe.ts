import "server-only";
import Stripe from "stripe";

export const PRICES = {
  oneShot: process.env.STRIPE_PRICE_ONE_SHOT!,
  subscription: process.env.STRIPE_PRICE_SUBSCRIPTION!,
} as const;

let _client: Stripe | null = null;
export function stripe() {
  if (!_client) {
    _client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _client;
}

import Stripe from "stripe";

let stripeSingleton = null;

/** Lazy Stripe client — allows server/tests to boot without STRIPE_SECRET_KEY. */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export function amountUsdToStripeCents(totalPriceUsd) {
  const n = Number(totalPriceUsd);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.round(n * 100);
}

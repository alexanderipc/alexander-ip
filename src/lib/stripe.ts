// Stripe configuration
// Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local

export const CONSULTATION_PRICE_USD = 12500; // $125.00 in cents
export const CONSULTATION_PRICE_GBP = 8500; // £85.00 in pence

export function getStripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  };
}

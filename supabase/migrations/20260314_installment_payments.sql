-- Add installment support to offers
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS installments integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS installments_paid integer NOT NULL DEFAULT 0;

-- Track individual installment payments
CREATE TABLE IF NOT EXISTS public.installment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount integer NOT NULL,                -- smallest currency unit (pence/cents)
  stripe_payment_id text,                 -- pi_xxx
  stripe_session_id text,                 -- cs_xxx
  invoice_number text,                    -- WEB-XXXX
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(offer_id, installment_number)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_installment_payments_offer
  ON public.installment_payments(offer_id);

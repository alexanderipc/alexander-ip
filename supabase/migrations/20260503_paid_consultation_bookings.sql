-- Paid 1-hour consultation bookings: scheduled via /book-consultation,
-- gated behind Stripe payment. Mirrors the lead_call_bookings model but with
-- a payment lifecycle:
--   pending  → row created when user clicks Book & Pay, slot is held
--   paid     → Stripe webhook confirmed payment, Google event created
--   expired  → user abandoned checkout (pending_until passed) — slot released
--   cancelled→ booking cancelled after payment
CREATE TABLE IF NOT EXISTS public.paid_consultation_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_email text NOT NULL,
  lead_name text NOT NULL,
  stage text CHECK (stage IN ('idea', 'prototype', 'filed', 'unsure')),
  topic text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  pending_until timestamptz, -- after this, the slot is auto-released
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount_minor int,          -- amount in smallest currency unit (pence/cents)
  currency text,
  google_event_id text,
  google_meet_url text,
  project_id uuid,           -- linked after the webhook creates a project row
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  paid_at timestamptz
);

-- Hard guarantee: at most one paid booking per slot.
CREATE UNIQUE INDEX IF NOT EXISTS idx_paid_consultation_unique_paid_slot
  ON public.paid_consultation_bookings(scheduled_at)
  WHERE status = 'paid';

-- For availability queries (filter by scheduled_at + status).
CREATE INDEX IF NOT EXISTS idx_paid_consultation_scheduled_at
  ON public.paid_consultation_bookings(scheduled_at);

-- Webhook lookup by Stripe session id.
CREATE INDEX IF NOT EXISTS idx_paid_consultation_stripe_session
  ON public.paid_consultation_bookings(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- Created-at sort for admin views.
CREATE INDEX IF NOT EXISTS idx_paid_consultation_created_at
  ON public.paid_consultation_bookings(created_at DESC);

-- RLS: service role only. The API uses the admin client; no direct client access.
ALTER TABLE public.paid_consultation_bookings ENABLE ROW LEVEL SECURITY;

-- Lead call bookings: free 15-min intro calls scheduled via /book-call
CREATE TABLE IF NOT EXISTS public.lead_call_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_email text NOT NULL,
  lead_name text NOT NULL,
  topic text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 15,
  status text NOT NULL DEFAULT 'booked'
    CHECK (status IN ('booked', 'cancelled', 'completed', 'no_show')),
  google_event_id text,
  google_meet_url text,
  source text,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Prevent double-booking the same slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_call_bookings_unique_slot
  ON public.lead_call_bookings(scheduled_at)
  WHERE status = 'booked';

-- Date-range lookups (availability check, admin views)
CREATE INDEX IF NOT EXISTS idx_lead_call_bookings_scheduled_at
  ON public.lead_call_bookings(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_lead_call_bookings_created_at
  ON public.lead_call_bookings(created_at DESC);

-- RLS: service role only. The API uses the admin client; no direct client access.
ALTER TABLE public.lead_call_bookings ENABLE ROW LEVEL SECURITY;

-- Switch intro call bookings to an approval workflow.
--
-- New lifecycle:
--   pending   → row created when lead clicks "Request Call". No GCal event yet.
--   booked    → admin approved; GCal event created and lead invited.
--   rejected  → admin rejected with a reason; lead emailed the reason.
--   cancelled → previously-approved booking later cancelled (kept for completeness).
--   completed / no_show — unchanged.
--
-- Default for new inserts becomes 'pending'.
-- Old approved-on-submit rows keep status='booked' — no data change needed.

ALTER TABLE public.lead_call_bookings
  DROP CONSTRAINT IF EXISTS lead_call_bookings_status_check;

ALTER TABLE public.lead_call_bookings
  ADD CONSTRAINT lead_call_bookings_status_check
    CHECK (status IN ('pending', 'booked', 'cancelled', 'rejected', 'completed', 'no_show'));

ALTER TABLE public.lead_call_bookings
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.lead_call_bookings
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.lead_call_bookings
  ADD COLUMN IF NOT EXISTS decided_at timestamptz;

-- The unique-slot index was: WHERE status = 'booked'.
-- That allows two leads to submit pending requests for the same slot, which is
-- fine (admin can only approve one). But we don't want two PENDING requests
-- to silently overlap either — surface them to the admin and let them decide.
-- So we keep the booked-only uniqueness as the hard guarantee.
-- (No change to idx_lead_call_bookings_unique_slot.)

-- Helper index for the admin queue: filter by status, newest first.
CREATE INDEX IF NOT EXISTS idx_lead_call_bookings_status_created
  ON public.lead_call_bookings(status, created_at DESC);

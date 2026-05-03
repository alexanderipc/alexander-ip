-- Add a "stage" qualifying field to free intro call bookings so Alex can
-- prioritise / prep for calls and (if needed) decline very early-stage ones.
ALTER TABLE public.lead_call_bookings
  ADD COLUMN IF NOT EXISTS stage text
    CHECK (stage IN ('idea', 'prototype', 'filed', 'unsure'));

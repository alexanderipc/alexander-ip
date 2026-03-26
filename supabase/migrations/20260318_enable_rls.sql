-- Enable RLS on tables flagged by Supabase security linter

-- explorer_waitlist: accessed only via service role (API routes)
ALTER TABLE public.explorer_waitlist ENABLE ROW LEVEL SECURITY;

-- installment_payments: accessed only via service role (Stripe webhook)
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;

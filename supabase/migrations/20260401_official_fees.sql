-- Add official patent office fee support to offers
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS include_official_fees boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS official_fee_office text,           -- e.g. 'EPO', 'WIPO'
  ADD COLUMN IF NOT EXISTS official_fee_sub_office text,       -- WIPO receiving office
  ADD COLUMN IF NOT EXISTS official_fee_currency text,         -- e.g. 'EUR', 'CAD'
  ADD COLUMN IF NOT EXISTS official_fee_amount integer,        -- smallest unit of fee currency
  ADD COLUMN IF NOT EXISTS cover_fee_amount integer;           -- smallest unit of offer currency

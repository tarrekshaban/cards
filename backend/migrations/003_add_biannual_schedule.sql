-- Migration: Add biannual schedule and period_half tracking
-- Run this in Supabase SQL Editor

-- 1. Add 'biannual' to the benefit_schedule enum
ALTER TYPE benefit_schedule ADD VALUE 'biannual';

-- 2. Add period_half column to benefit_redemptions
ALTER TABLE benefit_redemptions ADD COLUMN period_half INT;

-- 3. Update the unique constraint to include period_half
-- We need to drop the old one first. It doesn't have a name in the original migration,
-- so we'll find it or use the standard naming convention if possible.
-- In the original migration it was: UNIQUE(user_card_id, benefit_id, period_year, period_month, period_quarter)
-- Supabase usually names these like 'benefit_redemptions_user_card_id_benefit_id_period_year_per_key'

ALTER TABLE benefit_redemptions DROP CONSTRAINT IF EXISTS benefit_redemptions_user_card_id_benefit_id_period_year_per_key;
-- If the above didn't work, we can use this more generic approach:
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'benefit_redemptions_user_card_id_benefit_id_period_year_per_key') THEN
        ALTER TABLE benefit_redemptions DROP CONSTRAINT benefit_redemptions_user_card_id_benefit_id_period_year_per_key;
    END IF;
END $$;

-- Add the new unique constraint including period_half
ALTER TABLE benefit_redemptions ADD CONSTRAINT benefit_redemptions_period_unique 
    UNIQUE(user_card_id, benefit_id, period_year, period_month, period_quarter, period_half);

-- 4. Update the index
DROP INDEX IF EXISTS idx_benefit_redemptions_period;
CREATE INDEX idx_benefit_redemptions_period ON benefit_redemptions(period_year, period_month, period_quarter, period_half);

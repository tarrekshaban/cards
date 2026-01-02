-- Migration: Add partial redemption support
-- Run this in Supabase SQL Editor

-- 1. Add amount_redeemed column to benefit_redemptions
ALTER TABLE benefit_redemptions ADD COLUMN amount_redeemed DECIMAL(10, 2);

-- 2. Backfill existing rows: set amount_redeemed to the benefit's full value
-- (existing redemptions are treated as full redemptions)
UPDATE benefit_redemptions br
SET amount_redeemed = b.value
FROM benefits b
WHERE br.benefit_id = b.id AND br.amount_redeemed IS NULL;

-- 3. Make it NOT NULL after backfill
ALTER TABLE benefit_redemptions ALTER COLUMN amount_redeemed SET NOT NULL;

-- 4. Add a check constraint to ensure amount is positive
ALTER TABLE benefit_redemptions ADD CONSTRAINT amount_redeemed_positive CHECK (amount_redeemed > 0);

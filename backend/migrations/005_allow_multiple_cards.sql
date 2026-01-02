-- Migration: Allow multiple cards of the same type and add nickname
-- Run this in Supabase SQL Editor

-- 1. Remove unique constraint on (user_id, card_id)
-- Note: The constraint name is usually user_cards_user_id_card_id_key by default in Postgres
-- We use a DO block to safely drop it if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_cards_user_id_card_id_key'
    ) THEN
        ALTER TABLE user_cards DROP CONSTRAINT user_cards_user_id_card_id_key;
    END IF;
END $$;

-- 2. Add nickname column to user_cards
ALTER TABLE user_cards ADD COLUMN nickname TEXT;

-- Migration: Create cards, benefits, user_cards, and benefit_redemptions tables
-- Run this in Supabase SQL Editor

-- Create enum type for benefit schedules
CREATE TYPE benefit_schedule AS ENUM (
    'calendar_year',
    'card_year',
    'monthly',
    'quarterly',
    'one_time'
);

-- Cards table: master catalog of credit cards
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benefits table: benefits linked to each card
CREATE TABLE benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    schedule benefit_schedule NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User cards table: junction linking users to their cards
CREATE TABLE user_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    card_open_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

-- Benefit redemptions table: tracks when a user redeems a benefit
CREATE TABLE benefit_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
    benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    period_year INT NOT NULL,
    period_month INT,
    period_quarter INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure unique redemption per benefit per period
    UNIQUE(user_card_id, benefit_id, period_year, period_month, period_quarter)
);

-- Indexes for performance
CREATE INDEX idx_benefits_card_id ON benefits(card_id);
CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX idx_user_cards_card_id ON user_cards(card_id);
CREATE INDEX idx_benefit_redemptions_user_card_id ON benefit_redemptions(user_card_id);
CREATE INDEX idx_benefit_redemptions_benefit_id ON benefit_redemptions(benefit_id);
CREATE INDEX idx_benefit_redemptions_period ON benefit_redemptions(period_year, period_month, period_quarter);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cards (read-only for all authenticated users)
CREATE POLICY "Cards are viewable by authenticated users"
    ON cards FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for benefits (read-only for all authenticated users)
CREATE POLICY "Benefits are viewable by authenticated users"
    ON benefits FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for user_cards (users can only see/manage their own)
CREATE POLICY "Users can view their own cards"
    ON user_cards FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
    ON user_cards FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
    ON user_cards FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for benefit_redemptions (users can only manage their own via user_cards)
CREATE POLICY "Users can view their own redemptions"
    ON benefit_redemptions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_cards
            WHERE user_cards.id = benefit_redemptions.user_card_id
            AND user_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own redemptions"
    ON benefit_redemptions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_cards
            WHERE user_cards.id = benefit_redemptions.user_card_id
            AND user_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own redemptions"
    ON benefit_redemptions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_cards
            WHERE user_cards.id = benefit_redemptions.user_card_id
            AND user_cards.user_id = auth.uid()
        )
    );

-- Admin policies for cards and benefits (using service role key)
-- These tables are managed by admins only, so we use service role for mutations
CREATE POLICY "Service role can manage cards"
    ON cards FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can manage benefits"
    ON benefits FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benefits_updated_at
    BEFORE UPDATE ON benefits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_cards_updated_at
    BEFORE UPDATE ON user_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

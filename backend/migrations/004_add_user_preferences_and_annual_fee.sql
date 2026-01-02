-- Migration: Add user benefit preferences table and annual fee to cards
-- Run this in Supabase SQL Editor

-- 1. Add annual_fee column to cards table
ALTER TABLE cards ADD COLUMN annual_fee DECIMAL(10, 2) DEFAULT 0;

-- 2. Create user_benefit_preferences table for auto-redeem and hidden settings
CREATE TABLE user_benefit_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
    benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
    auto_redeem BOOLEAN DEFAULT FALSE,
    hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_card_id, benefit_id)
);

-- 3. Create indexes for performance
CREATE INDEX idx_user_benefit_preferences_user_card_id ON user_benefit_preferences(user_card_id);
CREATE INDEX idx_user_benefit_preferences_benefit_id ON user_benefit_preferences(benefit_id);

-- 4. Enable Row Level Security
ALTER TABLE user_benefit_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for user_benefit_preferences (users can only manage their own via user_cards)
CREATE POLICY "Users can view their own benefit preferences"
    ON user_benefit_preferences FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_cards
            WHERE user_cards.id = user_benefit_preferences.user_card_id
            AND user_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own benefit preferences"
    ON user_benefit_preferences FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_cards
            WHERE user_cards.id = user_benefit_preferences.user_card_id
            AND user_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own benefit preferences"
    ON user_benefit_preferences FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_cards
            WHERE user_cards.id = user_benefit_preferences.user_card_id
            AND user_cards.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_cards
            WHERE user_cards.id = user_benefit_preferences.user_card_id
            AND user_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own benefit preferences"
    ON user_benefit_preferences FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_cards
            WHERE user_cards.id = user_benefit_preferences.user_card_id
            AND user_cards.user_id = auth.uid()
        )
    );

-- 6. Service role can manage all preferences
CREATE POLICY "Service role can manage benefit preferences"
    ON user_benefit_preferences FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. Apply updated_at trigger
CREATE TRIGGER update_user_benefit_preferences_updated_at
    BEFORE UPDATE ON user_benefit_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

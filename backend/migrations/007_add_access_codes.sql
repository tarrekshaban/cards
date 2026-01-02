-- Migration: Add access codes table for registration
-- This replaces the email whitelist system

CREATE TABLE IF NOT EXISTS access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES auth.users(id),
    invalidated_at TIMESTAMPTZ,
    notes TEXT
);

-- Index for quick code lookup
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);

-- RLS policies
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Allow read access for signup validation (anyone can check if a code is valid)
CREATE POLICY "Anyone can read access codes for validation"
    ON access_codes
    FOR SELECT
    USING (true);

-- Only service role (admin client) can insert/update/delete
-- This is enforced by using the admin client in the backend
CREATE POLICY "Service role can manage access codes"
    ON access_codes
    FOR ALL
    USING (auth.role() = 'service_role');

-- Migration: 009_setup_platform_settings
-- Creates platform_settings table to persist system-wide configurations

CREATE TABLE IF NOT EXISTS platform_settings (
    id VARCHAR(50) PRIMARY KEY,
    platform_name VARCHAR(255) NOT NULL DEFAULT 'Play for Impact',
    default_prize_pool_percentage NUMERIC(5,2) NOT NULL DEFAULT 60.00,
    minimum_contribution_percent INTEGER NOT NULL DEFAULT 10,
    maximum_scores_per_user INTEGER NOT NULL DEFAULT 5,
    tier1_match_share NUMERIC(5,2) NOT NULL DEFAULT 40.00,
    tier2_match_share NUMERIC(5,2) NOT NULL DEFAULT 35.00,
    tier3_match_share NUMERIC(5,2) NOT NULL DEFAULT 25.00,
    jackpot_rollover_enabled BOOLEAN NOT NULL DEFAULT true,
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    support_email VARCHAR(255) NOT NULL DEFAULT 'support@playforimpact.in',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO platform_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

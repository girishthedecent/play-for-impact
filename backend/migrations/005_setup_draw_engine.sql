-- Migration: 005_setup_draw_engine
-- Creates draws and draw_entries tables for the monthly draw system

CREATE TABLE draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_date DATE NOT NULL,
    winning_numbers INTEGER[] CHECK (array_length(winning_numbers, 1) = 5),
    prize_pool DECIMAL(12, 2) DEFAULT 0,
    jackpot_rollover DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    algorithm VARCHAR(20) DEFAULT 'random' CHECK (algorithm IN ('random', 'weighted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_draws_draw_date ON draws(draw_date);

CREATE TABLE draw_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_numbers INTEGER[] CHECK (array_length(entry_numbers, 1) = 5),
    match_count INTEGER DEFAULT 0 CHECK (match_count >= 0 AND match_count <= 5),
    prize_amount DECIMAL(12, 2) DEFAULT 0,
    winner_status VARCHAR(20) DEFAULT 'pending' CHECK (winner_status IN ('pending', 'approved', 'rejected', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(draw_id, user_id)
);

CREATE INDEX idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON draw_entries(user_id);
CREATE INDEX idx_draw_entries_winner_status ON draw_entries(winner_status);

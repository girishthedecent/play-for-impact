-- Migration: 003_setup_scores
-- Creates scores table for Stableford score tracking

CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stableford_points INTEGER NOT NULL CHECK (stableford_points >= 1 AND stableford_points <= 45),
    course_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_date ON scores(date);
CREATE INDEX idx_scores_user_date ON scores(user_id, date);

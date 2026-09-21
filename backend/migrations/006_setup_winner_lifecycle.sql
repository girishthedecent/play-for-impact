-- Migration: 006_setup_winner_lifecycle
-- Creates winner_proofs table for proof verification

CREATE TABLE winner_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_entry_id UUID NOT NULL REFERENCES draw_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(10) NOT NULL CHECK (image_type IN ('jpeg', 'png')),
    image_size INTEGER NOT NULL CHECK (image_size > 0 AND image_size <= 5242880),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_winner_proofs_draw_entry_id ON winner_proofs(draw_entry_id);
CREATE INDEX idx_winner_proofs_user_id ON winner_proofs(user_id);

-- Create storage bucket for winner proofs
-- Note: This is a Supabase-specific operation and may need to be done via Supabase dashboard
-- INSERT INTO storage.buckets (id, name, public) VALUES ('winner-proofs', 'winner-proofs', false);

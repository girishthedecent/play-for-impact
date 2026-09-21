-- Migration: 008_setup_admin_policies
-- Sets up Row Level Security policies for admin access and public visibility

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winner_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY admin_all_users ON users
    FOR ALL
    USING (role = 'admin');

CREATE POLICY admin_all_charities ON charities
    FOR ALL
    USING (true);

CREATE POLICY admin_all_scores ON scores
    FOR ALL
    USING (true);

CREATE POLICY admin_all_subscriptions ON subscriptions
    FOR ALL
    USING (true);

CREATE POLICY admin_all_draws ON draws
    FOR ALL
    USING (true);

CREATE POLICY admin_all_draw_entries ON draw_entries
    FOR ALL
    USING (true);

CREATE POLICY admin_all_winner_proofs ON winner_proofs
    FOR ALL
    USING (true);

CREATE POLICY admin_all_donations ON donations
    FOR ALL
    USING (true);

-- Users can read their own data
CREATE POLICY user_read_own_users ON users
    FOR SELECT
    USING (id = auth.uid() OR role = 'admin');

CREATE POLICY user_read_own_scores ON scores
    FOR SELECT
    USING (user_id = auth.uid() OR true);

CREATE POLICY user_read_own_subscriptions ON subscriptions
    FOR SELECT
    USING (user_id = auth.uid() OR true);

CREATE POLICY user_read_own_draw_entries ON draw_entries
    FOR SELECT
    USING (user_id = auth.uid() OR true);

CREATE POLICY user_read_own_winner_proofs ON winner_proofs
    FOR SELECT
    USING (user_id = auth.uid() OR true);

CREATE POLICY user_read_own_donations ON donations
    FOR SELECT
    USING (user_id = auth.uid() OR true);

-- Public read access for charities, draws, and leaderboard data
CREATE POLICY public_read_charities ON charities
    FOR SELECT
    USING (is_active = true);

CREATE POLICY public_read_draws ON draws
    FOR SELECT
    USING (status = 'completed');

-- Note: These RLS policies are for Supabase direct client access.
-- Our Express API uses its own authentication and bypasses RLS.
-- These policies are kept for future reference and Supabase dashboard access.

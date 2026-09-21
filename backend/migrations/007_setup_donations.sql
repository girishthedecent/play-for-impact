-- Migration: 007_setup_donations
-- Creates donations table with triggers for automatic charity total updates

CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
    draw_entry_id UUID REFERENCES draw_entries(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_charity_id ON donations(charity_id);
CREATE INDEX idx_donations_created_at ON donations(created_at);

-- Function to update charity total_raised
CREATE OR REPLACE FUNCTION update_charity_total_raised()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE charities
    SET total_raised = total_raised + NEW.amount
    WHERE id = NEW.charity_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user total_impact (total donated)
CREATE OR REPLACE FUNCTION update_user_total_impact()
RETURNS TRIGGER AS $$
BEGIN
    -- This is a placeholder - total_impact can be computed from donations table
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update charity total when donation is made
CREATE TRIGGER trigger_update_charity_total
    AFTER INSERT ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_charity_total_raised();

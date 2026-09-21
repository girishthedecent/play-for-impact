-- Migration: 010_add_charity_fk_constraint
-- Adds foreign key constraint on users.selected_charity_id for referential integrity

ALTER TABLE users
  ADD CONSTRAINT fk_users_selected_charity
  FOREIGN KEY (selected_charity_id) REFERENCES charities(id)
  ON DELETE SET NULL;

-- Migration: 001_create_users
-- Creates the users table with authentication and profile fields

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'cancelled', 'expired')),
    subscription_plan VARCHAR(20) CHECK (subscription_plan IN ('basic', 'premium', 'vip')),
    selected_charity_id UUID,
    charity_contribution_percent INTEGER DEFAULT 10 CHECK (charity_contribution_percent >= 10 AND charity_contribution_percent <= 100),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- Seed admin user (password: admin123, bcrypt hash)
INSERT INTO users (email, password_hash, full_name, role, subscription_status, onboarding_completed)
VALUES (
    'admin@golfdraw.com',
    '$2a$10$Iw88rJP3rAAlbJ0c.9w5U.v4gEzxxztT2hr6Zb0gHLU/UHDEwbi4K',
    'Admin User',
    'admin',
    'active',
    true
);

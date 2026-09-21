-- Migration: 004_setup_subscriptions
-- Creates subscriptions table for payment tracking

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'premium', 'vip')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'past_due')),
    amount DECIMAL(10, 2) NOT NULL,
    renewal_date DATE,
    billing_period VARCHAR(10) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

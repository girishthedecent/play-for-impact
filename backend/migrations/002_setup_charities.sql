-- Migration: 002_setup_charities
-- Creates charities table and seeds verified Indian non-profits

CREATE TABLE IF NOT EXISTS charities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(500),
    image_url VARCHAR(500),
    total_raised DECIMAL(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charities_is_active ON charities(is_active);

-- Seed verified Indian charities
INSERT INTO charities (name, description, website) VALUES
(
    'Goonj',
    'A multi-award winning Indian non-profit addressing basic, ignored needs in rural and disaster-hit communities using urban surplus as a development catalyst.',
    'https://goonj.org'
),
(
    'Akshaya Patra Foundation',
    'The world''s largest NGO-run school meal programme, nourishing over 2 million children across 24,000+ government schools in India every single day.',
    'https://www.akshayapatra.org'
),
(
    'CRY - Child Rights and You',
    'India''s trusted children''s charity, partnering with grassroots communities across 19 states to champion child education, nutrition, healthcare, and protection.',
    'https://www.cry.org'
),
(
    'Pratham Education Foundation',
    'One of India''s largest non-governmental organisations dedicated to improving learning outcomes and basic literacy for underprivileged children nationwide.',
    'https://www.pratham.org'
),
(
    'HelpAge India',
    'Leading national NGO serving disadvantaged elderly citizens across India with mobile healthcare units, cataract surgeries, elder helplines, and livelihood support.',
    'https://www.helpageindia.org'
),
(
    'Magic Bus India Foundation',
    'Empowering adolescents and youth from underserved Indian communities to move out of poverty through life-skills education and livelihood readiness programmes.',
    'https://www.magicbus.org'
),
(
    'WWF-India',
    'Committed to wildlife conservation, protecting tiger corridors, river ecosystems, and sustainable biodiversity preservation across the Indian subcontinent.',
    'https://www.wwfindia.org'
),
(
    'GiveIndia (Give.do)',
    'India''s most trusted giving platform connecting donors to credible, verified 80G non-profits working across poverty alleviation, education, and healthcare.',
    'https://give.do'
);

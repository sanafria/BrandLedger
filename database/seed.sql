-- ==============================================================================
-- BrandLedger Realistic Demo Seed Data
-- Safe to rerun: uses ON CONFLICT DO NOTHING
-- ==============================================================================

-- 1. Insert Core Policy Cards
INSERT INTO policy_cards (
    id,
    policy_key,
    title,
    card_type,
    rule_text,
    approved_value,
    source_quote,
    valid_from,
    valid_until,
    severity,
    status,
    version,
    rules,
    metadata
) VALUES
(
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'pol_term_001',
    'Brand Addressing Terminology',
    'terminology',
    'The brand prohibits the term ''Customers'' and requires the term ''Members''. Always refer to account holders as members.',
    'Members',
    'The brand prohibits the term ''Customers'' and requires the term ''Members''.',
    '2026-01-01',
    NULL,
    'blocker',
    'active',
    1,
    '[{"type": "terminology", "prohibited": "Customers", "replacement": "Members", "quote": "The brand prohibits the term ''Customers'' and requires the term ''Members''."}]'::jsonb,
    '{"prohibited_terms": [{"term": "Customers", "replacement": "Members"}]}'::jsonb
),
(
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'pol_offer_002',
    'Summer Discount Promotion Validity',
    'offer',
    'Summer Discount promotion is valid through 2026-06-30. After this date, standard pricing applies.',
    'Standard Pricing',
    'Summer Discount promotion is valid through 2026-06-30.',
    '2026-05-01',
    '2026-06-30',
    'blocker',
    'active',
    1,
    '[{"type": "offer_validity", "offer_name": "Summer Discount", "valid_until": "2026-06-30", "quote": "Summer Discount promotion is valid through 2026-06-30."}]'::jsonb,
    '{"offer_name": "Summer Discount", "valid_until": "2026-06-30"}'::jsonb
),
(
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'pol_claim_003',
    'Superlative Market Claims Evidence',
    'claim',
    'Any superlative claim such as ''India''''s No. 1'' must be supported by certified market share documentation.',
    'Certified Documentation Required',
    'Any superlative claim such as ''India''''s No. 1'' must be supported by certified market share documentation.',
    '2026-01-01',
    NULL,
    'blocker',
    'active',
    1,
    '[{"type": "unsupported_claim", "claim_pattern": "India''s No. 1", "quote": "Any superlative claim such as ''India''''s No. 1'' must be supported by certified market share documentation."}]'::jsonb,
    '{"required_evidence": "Market share audit report"}'::jsonb
),
(
    'd4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f9a',
    'pol_num_004',
    'Bonus Points Transaction Limit',
    'fact',
    'Members can earn up to 500 bonus points per transaction. Any claim stating higher earnings is prohibited.',
    '500 bonus points',
    'Members can earn up to 500 bonus points per transaction.',
    '2026-01-01',
    NULL,
    'warning',
    'active',
    1,
    '[{"type": "numerical_limit", "entity": "bonus points", "max_value": 500, "quote": "Members can earn up to 500 bonus points per transaction."}]'::jsonb,
    '{"limit": 500, "unit": "points"}'::jsonb
)
ON CONFLICT (policy_key) DO UPDATE SET
    title = EXCLUDED.title,
    rule_text = EXCLUDED.rule_text,
    source_quote = EXCLUDED.source_quote,
    valid_until = EXCLUDED.valid_until,
    updated_at = NOW();

-- 2. Populate Immutable Policy Card Versions Snapshot
INSERT INTO policy_card_versions (
    policy_card_id,
    version,
    title,
    card_type,
    rule_text,
    approved_value,
    source_quote,
    valid_from,
    valid_until,
    severity,
    rules,
    metadata
)
SELECT
    id,
    version,
    title,
    card_type,
    rule_text,
    approved_value,
    source_quote,
    valid_from,
    valid_until,
    severity,
    rules,
    metadata
FROM policy_cards
ON CONFLICT (policy_card_id, version) DO NOTHING;

-- 3. Insert Demo Content Drafts
INSERT INTO content_drafts (
    id,
    title,
    content_text,
    status
) VALUES
(
    'e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
    'Social Post - Summer Launch (Violations)',
    'Our customers can now enjoy the exclusive Summer Discount and earn up to 800 bonus points! Join India''s No. 1 platform today.',
    'draft'
),
(
    'f6a7b89c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
    'Email Blast - Member Welcome (Compliant)',
    'Welcome Members! Enjoy standard pricing and earn up to 500 bonus points on your first transaction.',
    'draft'
)
ON CONFLICT (id) DO NOTHING;

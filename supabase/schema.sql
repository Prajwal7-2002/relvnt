-- =============================================================================
-- RELVNT FLAGSHIP MULTI-TENANT DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL 15+
-- Architecture: Multi-tenant Agency Isolation with Row-Level Security (RLS)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. AGENCIES (Tenant Workspace & White-Label Letterhead Profile)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Your Agency',
    slug VARCHAR(120) UNIQUE NOT NULL,
    tagline VARCHAR(255) DEFAULT 'Social Media & Distribution Advisory',
    auditor_name VARCHAR(255) NOT NULL DEFAULT 'Lead Strategist',
    auditor_role VARCHAR(255) NOT NULL DEFAULT 'Growth & Retention Director',
    contact_email VARCHAR(255) NOT NULL DEFAULT 'audit@youragency.com',
    confidentiality_seal VARCHAR(255) DEFAULT 'CONFIDENTIAL & PROPRIETARY // CLIENT EYES ONLY',
    monogram VARCHAR(8) DEFAULT 'YA',
    subscription_tier VARCHAR(50) DEFAULT 'agency_starter', -- 'free_audit', 'agency_starter', 'agency_scale'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agencies_user_id ON agencies(user_id);
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);

-- -----------------------------------------------------------------------------
-- 2. CLIENT ACCOUNTS (Monitored Brand Accounts under an Agency)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    account_handle VARCHAR(120) NOT NULL,            -- e.g. "@tech_founder"
    brand_name VARCHAR(255),                         -- e.g. "Tech Founder Media"
    platform VARCHAR(50) NOT NULL DEFAULT 'instagram', -- 'instagram', 'youtube', 'tiktok', 'meta_ads'
    metric_type VARCHAR(50) NOT NULL DEFAULT 'reach',  -- 'reach', 'impressions', 'views', 'roas'
    sync_source VARCHAR(50) NOT NULL DEFAULT 'csv_upload', -- 'csv_upload', 'google_sheet', 'meta_api'
    sync_config JSONB DEFAULT '{}'::jsonb,           -- e.g. { "sheet_url": "...", "sheet_id": "..." }
    current_health_score INT DEFAULT 50,             -- 0 - 100
    active_status VARCHAR(50) DEFAULT 'healthy',     -- 'healthy', 'warning', 'critical'
    last_audited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (agency_id, account_handle, platform)
);

CREATE INDEX IF NOT EXISTS idx_client_accounts_agency ON client_accounts(agency_id);
CREATE INDEX IF NOT EXISTS idx_client_accounts_status ON client_accounts(active_status);

-- -----------------------------------------------------------------------------
-- 3. TELEMETRY TIMESERIES (Daily Distribution Telemetry)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telemetry_timeseries (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    raw_metric_value DOUBLE PRECISION NOT NULL,
    baseline_7d DOUBLE PRECISION,
    baseline_30d DOUBLE PRECISION,
    z_score DOUBLE PRECISION,
    is_anomaly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (client_id, record_date)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_client_date ON telemetry_timeseries(client_id, record_date DESC);

-- -----------------------------------------------------------------------------
-- 4. FORENSIC INCIDENTS (Logged Algorithmic Decoupling & Anomalies)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forensic_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
    incident_date DATE NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'critical', -- 'critical', 'warning', 'nominal'
    classification VARCHAR(120) NOT NULL,              -- e.g. "Explore Feed Decoupling"
    variance_percentage DOUBLE PRECISION NOT NULL,     -- e.g. -42.8
    confidence_score DOUBLE PRECISION DEFAULT 0.94,    -- statistical certainty (0.0 - 1.0)
    root_cause_diagnosis TEXT NOT NULL,                -- scientific explanation
    turnaround_steps JSONB DEFAULT '[]'::jsonb,        -- structured 3-phase action plan
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_client ON forensic_incidents(client_id, incident_date DESC);

-- -----------------------------------------------------------------------------
-- 5. ALERT WEBHOOKS (Proactive Early-Warning Radar Integrations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL DEFAULT 'slack',     -- 'slack', 'discord', 'webhook', 'whatsapp'
    destination VARCHAR(500) NOT NULL,                -- webhook URL or phone endpoint
    trigger_threshold VARCHAR(50) DEFAULT 'critical_only', -- 'critical_only', 'warning_and_critical'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_agency ON alert_webhooks(agency_id);

-- -----------------------------------------------------------------------------
-- 6. ROW-LEVEL SECURITY (RLS) POLICIES
-- Ensures agencies can only view and mutate their own workspace data
-- -----------------------------------------------------------------------------
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_timeseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_webhooks ENABLE ROW LEVEL SECURITY;

-- Agency RLS: User can only see/modify their own agency
CREATE POLICY "Users access own agency" ON agencies
    FOR ALL USING (auth.uid() = user_id);

-- Client Accounts RLS
CREATE POLICY "Agencies access own clients" ON client_accounts
    FOR ALL USING (
        agency_id IN (SELECT id FROM agencies WHERE user_id = auth.uid())
    );

-- Telemetry Timeseries RLS
CREATE POLICY "Agencies access own telemetry" ON telemetry_timeseries
    FOR ALL USING (
        client_id IN (
            SELECT c.id FROM client_accounts c
            JOIN agencies a ON c.agency_id = a.id
            WHERE a.user_id = auth.uid()
        )
    );

-- Forensic Incidents RLS
CREATE POLICY "Agencies access own incidents" ON forensic_incidents
    FOR ALL USING (
        client_id IN (
            SELECT c.id FROM client_accounts c
            JOIN agencies a ON c.agency_id = a.id
            WHERE a.user_id = auth.uid()
        )
    );

-- Alert Webhooks RLS
CREATE POLICY "Agencies access own webhooks" ON alert_webhooks
    FOR ALL USING (
        agency_id IN (SELECT id FROM agencies WHERE user_id = auth.uid())
    );


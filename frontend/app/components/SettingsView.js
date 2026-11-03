"use client";

import { useState } from "react";

export default function SettingsView({
  agencyName,
  setAgencyName,
  auditorName,
  setAuditorName,
  agencyRole,
  setAgencyRole,
  agencyTagline,
  setAgencyTagline,
  agencyContact,
  setAgencyContact,
  confidentiality,
  setConfidentiality,
  slackWebhook,
  setSlackWebhook,
  radarThreshold,
  setRadarThreshold,
  onTestWebhook,
  onRunRadarScan,
  onGoogleSheetSync,
  onFileUpload,
  onInstagramSync,
  sheetUrl,
  setSheetUrl,
  clientHandle,
  setClientHandle,
  igToken,
  setIgToken,
  igBusinessId,
  setIgBusinessId,
  loading,
  notice,
}) {
  const [activeTab, setActiveTab] = useState("branding"); // "branding" | "radar" | "connectors" | "security"
  const [saveSuccess, setSaveSuccess] = useState(false);

  const getMonogram = (name) => {
    if (!name || !name.trim()) return "YA";
    const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleSaveBranding = async (e) => {
    e?.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("relvnt-agency-name", agencyName);
      localStorage.setItem("relvnt-auditor-name", auditorName);
      localStorage.setItem("relvnt-agency-role", agencyRole);
      localStorage.setItem("relvnt-agency-tagline", agencyTagline);
      localStorage.setItem("relvnt-agency-contact", agencyContact);
      localStorage.setItem("relvnt-confidentiality", confidentiality);
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/agency/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agencyName,
          tagline: agencyTagline,
          auditor_name: auditorName,
          auditor_role: agencyRole,
          contact_email: agencyContact,
          confidentiality: confidentiality,
          monogram: getMonogram(agencyName),
        }),
      });
    } catch (_) {}

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="settings-container">
      {/* SETTINGS HEADER */}
      <div className="settings-header-card">
        <div>
          <span className="settings-kicker">Agency Workspace Management</span>
          <h2 className="settings-title">Integrations &amp; Workspace Configuration</h2>
          <p className="settings-subtitle">
            Configure executive white-label branding, automated decoupling radar alerts, and client data connectors.
          </p>
        </div>
      </div>

      {/* HORIZONTAL TAB SELECTOR */}
      <div className="settings-tabs-row">
        <button
          onClick={() => setActiveTab("branding")}
          className={`settings-tab-btn ${activeTab === "branding" ? "settings-tab-btn-active" : ""}`}
        >
          Agency Branding &amp; Memo
        </button>
        <button
          onClick={() => setActiveTab("radar")}
          className={`settings-tab-btn ${activeTab === "radar" ? "settings-tab-btn-active" : ""}`}
        >
          Decoupling Radar &amp; Webhooks
        </button>
        <button
          onClick={() => setActiveTab("connectors")}
          className={`settings-tab-btn ${activeTab === "connectors" ? "settings-tab-btn-active" : ""}`}
        >
          Data Connectors (Sheets, CSV &amp; Meta API)
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`settings-tab-btn ${activeTab === "security" ? "settings-tab-btn-active" : ""}`}
        >
          Security Hardening &amp; Governance
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {notice && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "20px",
            background: notice.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            color: notice.type === "success" ? "#10B981" : "#EF4444",
            border: `1px solid ${notice.type === "success" ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{notice.text}</span>
        </div>
      )}

      {/* TAB 1: WHITE-LABEL BRANDING */}
      {activeTab === "branding" && (
        <div className="settings-grid-layout">
          <div className="settings-panel">
            <h3 className="panel-title">White-Label Branding Profile</h3>
            <p className="panel-subtitle">These details replace all Relvnt branding in boardroom PDF memos and Slack alerts.</p>

            <form onSubmit={handleSaveBranding} className="settings-form">
              <div className="form-group">
                <label className="form-label">Agency / Firm Name</label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="input-text-field"
                  placeholder="e.g. Apex Distribution Lab"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Agency Tagline / Subtitle</label>
                <input
                  type="text"
                  value={agencyTagline}
                  onChange={(e) => setAgencyTagline(e.target.value)}
                  className="input-text-field"
                  placeholder="e.g. Social Media & Distribution Advisory"
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Lead Auditor Name</label>
                  <input
                    type="text"
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    className="input-text-field"
                    placeholder="e.g. Managing Director"
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Auditor Professional Title</label>
                  <input
                    type="text"
                    value={agencyRole}
                    onChange={(e) => setAgencyRole(e.target.value)}
                    className="input-text-field"
                    placeholder="e.g. Head of Performance Marketing"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact / Inquiries Email</label>
                <input
                  type="email"
                  value={agencyContact}
                  onChange={(e) => setAgencyContact(e.target.value)}
                  className="input-text-field"
                  placeholder="audit@youragency.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Boardroom Confidentiality Attestation</label>
                <input
                  type="text"
                  value={confidentiality}
                  onChange={(e) => setConfidentiality(e.target.value)}
                  className="input-text-field"
                  placeholder="CONFIDENTIAL & PROPRIETARY · PREPARED FOR CLIENT"
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: "12px" }}>
                {saveSuccess ? "✓ Profile Saved Successfully" : "Save White-Label Profile"}
              </button>
            </form>
          </div>

          {/* LIVE PREVIEW CARD */}
          <div className="settings-panel">
            <h3 className="panel-title">Live Boardroom Memo Preview</h3>
            <p className="panel-subtitle">Instant visual representation of your generated PDF memo header.</p>

            <div className="memo-preview-box">
              <div className="memo-preview-header">
                <div className="memo-preview-monogram">{getMonogram(agencyName)}</div>
                <div style={{ flex: 1 }}>
                  <div className="memo-preview-title">
                    RELVNT × {agencyName.toUpperCase()} · DISTRIBUTION AUDIT
                  </div>
                  <div className="memo-preview-sub">
                    {agencyTagline} • Lead Auditor: <strong>{auditorName}</strong> ({agencyRole})
                  </div>
                </div>
              </div>

              <div className="memo-preview-meta">
                <span>{confidentiality}</span>
                <span>Inquiries: {agencyContact}</span>
              </div>

              <div className="memo-preview-body">
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                  Sample Executive Signoff:
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--text-primary)", fontStyle: "italic", borderLeft: "2px solid var(--border-medium)", paddingLeft: "10px" }}>
                  &ldquo;Certified algorithmic anomaly baseline audit completed under confidential retainer engagement.&rdquo;
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EARLY-WARNING RADAR & WEBHOOKS */}
      {activeTab === "radar" && (
        <div className="settings-panel" style={{ maxWidth: "800px" }}>
          <h3 className="panel-title">Automated Decoupling Surveillance &amp; Alerts</h3>
          <p className="panel-subtitle">
            Configure incoming Slack or Discord webhooks. Relvnt monitors daily baselines and immediately notifies your growth team when reach drops unexpectedly.
          </p>

          <div className="form-group" style={{ marginTop: "20px" }}>
            <label className="form-label">Slack or Discord Incoming Webhook URL</label>
            <input
              type="url"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              className="input-text-field"
              placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
            />
            <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Alert cards are formatted automatically for both Slack Block Kit and Discord Embeds. Guarded by SSRF filter.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Alert Sensitivity Threshold</label>
            <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
              <label style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: "8px",
                border: radarThreshold === "critical" ? "2px solid #EF4444" : "1px solid var(--border-subtle)",
                background: radarThreshold === "critical" ? "rgba(239, 68, 68, 0.08)" : "var(--bg-surface-subtle)",
                cursor: "pointer",
              }}>
                <input
                  type="radio"
                  name="threshold"
                  value="critical"
                  checked={radarThreshold === "critical"}
                  onChange={() => setRadarThreshold("critical")}
                  style={{ marginRight: "8px" }}
                />
                <strong style={{ color: "#EF4444" }}>Critical Incidents Only (&lt; 40 Health)</strong>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Triggers only when algorithmic suppression or acute distribution failure is detected (-50% or worse).
                </div>
              </label>

              <label style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: "8px",
                border: radarThreshold === "warning" ? "2px solid #F59E0B" : "1px solid var(--border-subtle)",
                background: radarThreshold === "warning" ? "rgba(245, 158, 11, 0.08)" : "var(--bg-surface-subtle)",
                cursor: "pointer",
              }}>
                <input
                  type="radio"
                  name="threshold"
                  value="warning"
                  checked={radarThreshold === "warning"}
                  onChange={() => setRadarThreshold("warning")}
                  style={{ marginRight: "8px" }}
                />
                <strong style={{ color: "#F59E0B" }}>Early Warning (&lt; 70 Health)</strong>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Triggers on subtle distribution drift, ad creative fatigue, or mild baseline decoupling.
                </div>
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button
              onClick={onTestWebhook}
              disabled={loading || !slackWebhook.trim()}
              className="btn-secondary"
            >
              {loading ? "Delivering..." : "⚡ Send Verification Test Ping"}
            </button>
            <button
              onClick={onRunRadarScan}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Scanning Portfolio..." : "🛰️ Run Full Radar Scan Across All Clients"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: DATA CONNECTORS */}
      {activeTab === "connectors" && (
        <div className="settings-grid-layout">
          {/* GOOGLE SHEETS */}
          <div className="settings-panel">
            <h3 className="panel-title">Google Sheets Live Sync</h3>
            <p className="panel-subtitle">Automatically parse client performance spreadsheets with zero manual CSV export.</p>

            <form onSubmit={onGoogleSheetSync} className="settings-form" style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label className="form-label">Client / Brand Handle</label>
                <input
                  type="text"
                  value={clientHandle}
                  onChange={(e) => setClientHandle(e.target.value)}
                  className="input-text-field"
                  placeholder="e.g. @acme_brand or DTC Retargeting"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Google Sheets URL</label>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="input-text-field"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  required
                />
                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Must be set to &ldquo;Anyone with link can view&rdquo;. Expected columns: Date and Reach (or ROAS).
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !sheetUrl.trim()}
                className="btn-primary"
                style={{ marginTop: "10px" }}
              >
                {loading ? "Evaluating..." : "Live Sync Google Sheet"}
              </button>
            </form>
          </div>

          {/* CSV INGESTION */}
          <div className="settings-panel">
            <h3 className="panel-title">Direct CSV File Drop</h3>
            <p className="panel-subtitle">Upload any analytics export. Relvnt auto-detects date columns, headers, and currency symbols.</p>

            <div style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label className="form-label">Client / Brand Handle</label>
                <input
                  type="text"
                  value={clientHandle}
                  onChange={(e) => setClientHandle(e.target.value)}
                  className="input-text-field"
                  placeholder="e.g. @client_account"
                />
              </div>

              <div className="file-dropzone">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onFileUpload}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                />
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>📄</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Click or drag CSV file to upload
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Protected by automated formula injection neutralization and MIME check
                </div>
              </div>
            </div>
          </div>

          {/* META GRAPH API LIVE SYNC */}
          <div className="settings-panel" style={{ gridColumn: "1 / -1" }}>
            <h3 className="panel-title">Meta Graph API (Direct Instagram Insights)</h3>
            <p className="panel-subtitle">Pull authentic 90-day reach insights directly from Meta Graph API without file exports.</p>

            <form onSubmit={onInstagramSync} className="settings-form" style={{ marginTop: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Meta User Access Token</label>
                  <input
                    type="password"
                    value={igToken}
                    onChange={(e) => setIgToken(e.target.value)}
                    className="input-text-field"
                    placeholder="EAA..."
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                    Leave blank to use server environment credentials (INSTAGRAM_ACCESS_TOKEN).
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Instagram Business Account ID</label>
                  <input
                    type="text"
                    value={igBusinessId}
                    onChange={(e) => setIgBusinessId(e.target.value)}
                    className="input-text-field"
                    placeholder="1784..."
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                    Leave blank to use server environment credentials (INSTAGRAM_BUSINESS_ID).
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: "fit-content", marginTop: "6px" }}
              >
                {loading ? "Connecting to Meta API..." : "Sync Live Instagram Insights"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: TENANT SECURITY & ENCLAVE */}
      {activeTab === "security" && (
        <div className="settings-panel" style={{ maxWidth: "880px" }}>
          <h3 className="panel-title">Enterprise Security Hardening &amp; Compliance</h3>
          <p className="panel-subtitle">
            Relvnt is engineered with strict defensive security controls across rate limiting, network SSRF protection, formula injection defense, and cryptographic multi-tenancy.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
            <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--status-nominal)", textTransform: "uppercase" }}>● Active Enforcement</div>
              <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                Tiered Rate Limiter (RFC 6585)
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "6px 0 0 0", lineHeight: 1.45 }}>
                Compute endpoints capped at 45 req/min; metadata endpoints capped at 180 req/min. Emits <code>X-RateLimit-*</code> and <code>Retry-After</code> headers.
              </p>
            </div>

            <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--status-nominal)", textTransform: "uppercase" }}>● Active Enforcement</div>
              <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                Network SSRF Protection
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "6px 0 0 0", lineHeight: 1.45 }}>
                Destination URLs resolved through strict DNS validation; private ranges (RFC 1918) and cloud metadata services (169.254.169.254) are rejected.
              </p>
            </div>

            <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--status-nominal)", textTransform: "uppercase" }}>● Active Enforcement</div>
              <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                CSV Formula Sanitization (CWE-1236)
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "6px 0 0 0", lineHeight: 1.45 }}>
                Uploaded files are scanned for formula triggers (<code>=</code>, <code>+</code>, <code>-</code>, <code>@</code>) and sanitized before entering computation pipelines.
              </p>
            </div>

            <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--status-nominal)", textTransform: "uppercase" }}>● Active Enforcement</div>
              <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                Zero-Retention Enclave &amp; CSP
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "6px 0 0 0", lineHeight: 1.45 }}>
                Strict Content-Security-Policy disallows frame embedding (clickjacking defense). Machine learning executes locally with zero persistent telemetry leakage.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

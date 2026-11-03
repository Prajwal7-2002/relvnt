"use client";

import { useState } from "react";

const TEMPLATES = [
  {
    label: "Boutique Social Agency",
    agency: "Vanguard Social Media",
    auditor: "Lead Growth Strategist",
    role: "Head of Content & Distribution",
    tagline: "Social Media Strategy & Reels Retention Lab",
    contact: "audit@vanguardsocial.com",
    confidentiality: "CONFIDENTIAL & PROPRIETARY // CLIENT EYES ONLY",
  },
  {
    label: "D2C Performance Lab",
    agency: "Catalyst D2C Growth",
    auditor: "Principal Media Buyer",
    role: "VP of Performance Marketing",
    tagline: "Paid Social & Creative Anomaly Diagnostics",
    contact: "insights@catalystd2c.com",
    confidentiality: "INTERNAL EXECUTIVE STRATEGY AUDIT",
  },
  {
    label: "Founder Branding Firm",
    agency: "Apex Executive Brand Studio",
    auditor: "Managing Director",
    role: "Lead Executive Ghostwriter",
    tagline: "Founder Personal Branding & Algorithm Navigation",
    contact: "partners@apexbrand.com",
    confidentiality: "BOARDROOM DISTRIBUTION AUDIT",
  },
];

export default function AgencyBrandingModal({
  isOpen,
  onClose,
  currentAgencyName,
  currentAuditorName,
  currentAgencyRole,
  currentAgencyTagline,
  currentAgencyContact,
  currentConfidentiality,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "letterhead"
  const [previewTab, setPreviewTab] = useState("memo"); // "memo" | "email"

  const [agency, setAgency] = useState(currentAgencyName || "Your Agency");
  const [auditor, setAuditor] = useState(currentAuditorName || "Lead Strategist");
  const [role, setRole] = useState(currentAgencyRole || "Growth & Retention Director");
  const [tagline, setTagline] = useState(currentAgencyTagline || "Social Media & Distribution Advisory");
  const [contact, setContact] = useState(currentAgencyContact || "audit@youragency.com");
  const [confidentiality, setConfidentiality] = useState(
    currentConfidentiality || "CONFIDENTIAL & PROPRIETARY // CLIENT EYES ONLY"
  );

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl) => {
    setAgency(tpl.agency);
    setAuditor(tpl.auditor);
    setRole(tpl.role);
    setTagline(tpl.tagline);
    setContact(tpl.contact);
    setConfidentiality(tpl.confidentiality);
  };

  const handleResetDefaults = () => {
    setAgency("Your Agency");
    setAuditor("Lead Strategist");
    setRole("Growth & Retention Director");
    setTagline("Social Media & Distribution Advisory");
    setContact("audit@youragency.com");
    setConfidentiality("CONFIDENTIAL & PROPRIETARY // CLIENT EYES ONLY");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      agencyName: agency.trim() || "Your Agency",
      auditorName: auditor.trim() || "Lead Strategist",
      agencyRole: role.trim() || "Growth Director",
      agencyTagline: tagline.trim() || "Distribution Advisory",
      agencyContact: contact.trim() || "audit@youragency.com",
      confidentiality: confidentiality.trim() || "CONFIDENTIAL",
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-large" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-badge-row">
              <span className="agency-brand-dot" />
              <span className="modal-badge-text">WHITE-LABEL AGENCY SUITE</span>
            </div>
            <h2 className="modal-title">Agency Identity &amp; Letterhead Customizer</h2>
            <p className="modal-subtitle">
              Co-brand all client Boardroom PDF Memos and AI Analyst email communications under your agency&apos;s name.
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            ×
          </button>
        </div>

        {/* 1-CLICK PRESET INSPIRATION CHIPS */}
        <div className="branding-template-bar">
          <span className="branding-template-label">Quick 1-Click Agency Archetypes:</span>
          <div className="branding-chips">
            {TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="branding-chip-btn"
                title={`Load ${tpl.label} defaults`}
              >
                + {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="branding-tab-nav">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`branding-nav-tab ${activeTab === "profile" ? "branding-nav-tab-active" : ""}`}
          >
            1. Agency &amp; Auditor Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("letterhead")}
            className={`branding-nav-tab ${activeTab === "letterhead" ? "branding-nav-tab-active" : ""}`}
          >
            2. Memo Letterhead &amp; Security Seal
          </button>
        </div>

        <form onSubmit={handleSubmit} className="branding-form">
          {activeTab === "profile" ? (
            <div className="branding-fields-grid">
              <div className="form-group-full">
                <label className="input-label">Agency / Firm Name</label>
                <input
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  placeholder="e.g. Apex Growth Studio"
                  className="text-input"
                  required
                />
                <span className="input-hint">Renders prominently at the top of the Boardroom PDF Audit Memo.</span>
              </div>

              <div>
                <label className="input-label">Lead Auditor / Founder Name</label>
                <input
                  type="text"
                  value={auditor}
                  onChange={(e) => setAuditor(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="text-input"
                  required
                />
              </div>

              <div>
                <label className="input-label">Professional Role / Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. VP of Performance &amp; Analytics"
                  className="text-input"
                />
              </div>

              <div className="form-group-full">
                <label className="input-label">Agency Specialization / Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Organic Reels &amp; Meta Ads Distribution Advisory"
                  className="text-input"
                />
              </div>
            </div>
          ) : (
            <div className="branding-fields-grid">
              <div className="form-group-full">
                <label className="input-label">Confidentiality Watermark</label>
                <select
                  value={confidentiality}
                  onChange={(e) => setConfidentiality(e.target.value)}
                  className="text-input select-input"
                >
                  <option value="CONFIDENTIAL &amp; PROPRIETARY // CLIENT EYES ONLY">
                    CONFIDENTIAL &amp; PROPRIETARY // CLIENT EYES ONLY
                  </option>
                  <option value="INTERNAL EXECUTIVE STRATEGY AUDIT // STRICT NON-ATTRIBUTION">
                    INTERNAL EXECUTIVE STRATEGY AUDIT // STRICT NON-ATTRIBUTION
                  </option>
                  <option value="BOARDROOM DISTRIBUTION AUDIT // CERTIFIED SENTINEL PROTOCOL">
                    BOARDROOM DISTRIBUTION AUDIT // CERTIFIED SENTINEL PROTOCOL
                  </option>
                  <option value="OFFICIAL 72-HOUR ALGORITHMIC TURNAROUND RUNBOOK">
                    OFFICIAL 72-HOUR ALGORITHMIC TURNAROUND RUNBOOK
                  </option>
                </select>
                <span className="input-hint">Printed as the formal sub-header in client exports.</span>
              </div>

              <div className="form-group-full">
                <label className="input-label">Audit Inquiries / Direct Contact Email</label>
                <input
                  type="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="audit@youragency.com"
                  className="text-input"
                />
                <span className="input-hint">Included in the official verification block for client follow-ups.</span>
              </div>
            </div>
          )}

          {/* INTERACTIVE DUAL PREVIEW SUITE */}
          <div className="branding-preview-suite">
            <div className="preview-suite-header">
              <span className="preview-suite-title">Live White-Label Output Preview:</span>
              <div className="preview-mode-pills">
                <button
                  type="button"
                  onClick={() => setPreviewTab("memo")}
                  className={`preview-pill-btn ${previewTab === "memo" ? "preview-pill-btn-active" : ""}`}
                >
                  📄 Boardroom PDF Letterhead
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("email")}
                  className={`preview-pill-btn ${previewTab === "email" ? "preview-pill-btn-active" : ""}`}
                >
                  ✉️ AI Copilot Email Draft
                </button>
              </div>
            </div>

            {previewTab === "memo" ? (
              <div className="memo-letterhead-replica">
                <div className="replica-topbar">
                  <div>
                    <div className="replica-brand">
                      RELVNT × {agency.toUpperCase() || "YOUR AGENCY"}
                    </div>
                    <div className="replica-sub">
                      {tagline} • Lead Auditor: <strong>{auditor}</strong> ({role})
                    </div>
                  </div>
                  <div className="replica-meta">
                    <span className="replica-date">AUDIT REF: #{Math.floor(Math.random() * 8000 + 1000)}</span>
                    <span className="replica-jurisdiction">ISO-STAT 5D PROTOCOL</span>
                  </div>
                </div>
                <div className="replica-confidentiality">
                  {confidentiality}
                </div>
              </div>
            ) : (
              <div className="email-signature-replica">
                <div className="email-meta-line">
                  <strong>Subject:</strong> Algorithmic Anomaly Diagnostic &amp; 72h Turnaround // @client_brand
                </div>
                <div className="email-body-snippet">
                  &ldquo;...Our Sentinel diagnostic radar detected Explore Feed Decoupling on Oct 28th. We have initiated our 72-hour turnaround protocol to re-index distribution...&rdquo;
                </div>
                <div className="email-signoff-block">
                  <div className="signoff-name">{auditor || "Your Name"}</div>
                  <div className="signoff-role">{role || "Strategist"} • {agency || "Your Agency"}</div>
                  <div className="signoff-contact">{contact} • Forensic Incident Protocol v1.2.0</div>
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="branding-modal-footer">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn-secondary btn-reset-defaults"
              title="Reset all fields to neutral defaults"
            >
              ↺ Reset to Defaults
            </button>
            <div className="branding-footer-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary btn-save-branding">
                ✓ Save &amp; Apply Agency Branding
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

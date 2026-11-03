"use client";

import { useState, useRef, useEffect } from "react";

const TEMPLATES = [
  {
    label: "Multi-Channel Performance Agency",
    sublabel: "Paid Ads & ROI Radar",
    agency: "Apex Growth Studio",
    auditor: "Lead Growth Strategist",
    role: "Head of Performance Marketing",
    tagline: "Paid Social, Google Ads & Client ROI Radar",
    contact: "audit@apexgrowth.com",
    confidentiality: "CONFIDENTIAL & PROPRIETARY // CLIENT EYES ONLY",
  },
  {
    label: "Digital Marketing Agency",
    sublabel: "Meta & Google Ads",
    agency: "Vanguard Digital Media",
    auditor: "Managing Director",
    role: "VP of Client Strategy & Media",
    tagline: "Performance Marketing, Meta & Google Ads Lab",
    contact: "growth@vanguardmedia.com",
    confidentiality: "CONFIDENTIAL & PROPRIETARY // CLIENT EYES ONLY",
  },
  {
    label: "Boutique Social Agency",
    sublabel: "Social & Reels",
    agency: "Pulse Social Media",
    auditor: "Lead Content Strategist",
    role: "Head of Content & Distribution",
    tagline: "Social Media Strategy & Reels Retention Lab",
    contact: "audit@pulsesocial.com",
    confidentiality: "CONFIDENTIAL & PROPRIETARY // CLIENT EYES ONLY",
  },
  {
    label: "D2C Performance Lab",
    sublabel: "Paid Social & ROAS",
    agency: "Catalyst D2C Growth",
    auditor: "Principal Media Buyer",
    role: "VP of Performance Marketing",
    tagline: "Paid Social & Creative Anomaly Diagnostics",
    contact: "insights@catalystd2c.com",
    confidentiality: "INTERNAL EXECUTIVE STRATEGY AUDIT",
  },
  {
    label: "Founder Branding Firm",
    sublabel: "Executive Distribution",
    agency: "Beacon Executive Studio",
    auditor: "Managing Director",
    role: "Lead Executive Strategist",
    tagline: "Founder Personal Branding & Algorithm Navigation",
    contact: "partners@beaconstudio.com",
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
  const [previewTab, setPreviewTab] = useState("memo"); // "memo" | "email"
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [agency, setAgency] = useState(currentAgencyName || "Your Agency");
  const [auditor, setAuditor] = useState(currentAuditorName || "Lead Strategist");
  const [role, setRole] = useState(currentAgencyRole || "Growth & Retention Director");
  const [tagline, setTagline] = useState(currentAgencyTagline || "Social Media & Distribution Advisory");
  const [contact, setContact] = useState(currentAgencyContact || "audit@youragency.com");
  const [confidentiality, setConfidentiality] = useState(
    currentConfidentiality || "CONFIDENTIAL & PROPRIETARY // CLIENT EYES ONLY"
  );

  const overlayMouseDownRef = useRef(false);

  // Close with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name || !name.trim()) return "YA";
    const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "YA";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

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
      agencyName: (agency || "").trim() || "Your Agency",
      auditorName: (auditor || "").trim() || "Lead Strategist",
      agencyRole: (role || "").trim() || "Growth Director",
      agencyTagline: (tagline || "").trim() || "Distribution Advisory",
      agencyContact: (contact || "").trim() || "audit@youragency.com",
      confidentiality: (confidentiality || "").trim() || "CONFIDENTIAL",
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 350);
  };

  // Safe backdrop click handling that NEVER closes when dragging / selecting text
  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      overlayMouseDownRef.current = true;
    }
  };

  const handleOverlayMouseUp = (e) => {
    const hasSelection =
      typeof window !== "undefined" &&
      window.getSelection &&
      window.getSelection().toString().trim().length > 0;

    // Only close if mousedown was strictly on the backdrop AND mouseup was on backdrop AND no text was selected
    if (overlayMouseDownRef.current && e.target === e.currentTarget && !hasSelection) {
      onClose();
    }
    overlayMouseDownRef.current = false;
  };

  // Prevent Enter key in inputs from prematurely submitting the form and closing the modal
  const handleFormKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") {
      e.preventDefault();
    }
  };

  const initials = getInitials(agency);
  const auditorInitials = getInitials(auditor);

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-box modal-box-suite"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-badge-row">
              <span className="agency-brand-dot" />
              <span className="modal-badge-text">WHITE-LABEL AGENCY SUITE</span>
              <span className="modal-badge-sub">CLIENT PRESENTATION READY</span>
            </div>
            <h2 className="modal-title">Agency White-Label Customizer</h2>
            <p className="modal-subtitle">
              Co-brand all client Boardroom PDF Memos, Audit Reports, and AI Analyst communications with your agency&apos;s identity.
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* 1-CLICK PRESET TEMPLATES */}
        <div className="branding-template-bar">
          <div className="branding-template-label-wrap">
            <span className="branding-template-label">1-Click Agency Archetypes:</span>
            <span className="branding-template-sub">Select to auto-populate production presets</span>
          </div>
          <div className="branding-chips">
            {TEMPLATES.map((tpl, i) => {
              const isActive = (agency || "").toLowerCase().trim() === tpl.agency.toLowerCase().trim();
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`branding-chip-btn ${isActive ? "branding-chip-btn-active" : ""}`}
                  title={`Load ${tpl.label} (${tpl.sublabel}) configuration`}
                >
                  <span className="chip-dot" />
                  <span>{tpl.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TWO-COLUMN WORKBENCH: FORM ON LEFT, REAL-TIME PREVIEW ON RIGHT */}
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="branding-workbench-grid">
          {/* LEFT COLUMN: EDITABLE INPUTS */}
          <div className="branding-inputs-column">
            <div className="branding-section-heading">
              <span>1. FIRM &amp; AUDITOR PROFILE</span>
            </div>

            <div className="form-group">
              <label className="input-label">Agency / Firm Name</label>
              <input
                type="text"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="e.g. Apex Growth Studio"
                className="text-input"
              />
              <span className="input-micro-hint">Displayed prominently in letterhead and client audit documents.</span>
            </div>

            <div className="form-row-duo">
              <div className="form-group">
                <label className="input-label">Lead Auditor / Founder</label>
                <input
                  type="text"
                  value={auditor}
                  onChange={(e) => setAuditor(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <label className="input-label">Professional Role / Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. VP of Performance Marketing"
                  className="text-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Agency Specialization / Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Multi-Channel Performance Ads &amp; ROI Turnaround"
                className="text-input"
              />
            </div>

            <div className="branding-section-heading" style={{ marginTop: "14px" }}>
              <span>2. LETTERHEAD &amp; SECURITY PROTOCOL</span>
            </div>

            <div className="form-group">
              <label className="input-label">Confidentiality Classification</label>
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
            </div>

            <div className="form-group">
              <label className="input-label">Audit Direct Inquiries Email</label>
              <input
                type="email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="audit@youragency.com"
                className="text-input"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: REAL-TIME DUAL PREVIEW */}
          <div className="branding-preview-column">
            <div className="preview-column-header">
              <div className="preview-heading-wrap">
                <span className="preview-column-title">Real-Time Client Preview</span>
                <span className="preview-column-sub">Live simulation of client-facing deliverables</span>
              </div>
              <div className="preview-mode-pills">
                <button
                  type="button"
                  onClick={() => setPreviewTab("memo")}
                  className={`preview-pill-btn ${previewTab === "memo" ? "preview-pill-btn-active" : ""}`}
                >
                  📄 Boardroom PDF Memo
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("email")}
                  className={`preview-pill-btn ${previewTab === "email" ? "preview-pill-btn-active" : ""}`}
                >
                  ✉️ AI Analyst Email Draft
                </button>
              </div>
            </div>

            {previewTab === "memo" ? (
              <div className="memo-letterhead-replica">
                <div className="replica-watermark-tag">OFFICIAL AUDIT MEMO</div>
                <div className="replica-topbar">
                  <div className="replica-brand-group">
                    <div className="replica-monogram-box" title={`${agency || "Agency"} Identity Seal`}>
                      <span>{initials}</span>
                    </div>
                    <div>
                      <div className="replica-brand">
                        RELVNT &times; {(agency || "YOUR AGENCY").toUpperCase()}
                      </div>
                      <div className="replica-sub">{tagline || "Social Media & Distribution Advisory"}</div>
                      <div className="replica-auditor">
                        Lead Auditor: <strong>{auditor || "Lead Strategist"}</strong> &bull; {role || "Growth Director"}
                      </div>
                    </div>
                  </div>
                  <div className="replica-meta">
                    <span className="replica-date">AUDIT REF: #8492</span>
                    <span className="replica-jurisdiction">ISO-STAT 5D PROTOCOL</span>
                    <span className="replica-secure-tag">VERIFIED SENTINEL</span>
                  </div>
                </div>

                <div className="replica-confidentiality-row">
                  <span>{confidentiality || "CONFIDENTIAL & PROPRIETARY"}</span>
                  <span>Inquiries: {contact || "audit@youragency.com"}</span>
                </div>

                <div className="replica-sample-body">
                  <div className="replica-body-title">EXECUTIVE INCIDENT TELEMETRY &bull; 72H AUDIT</div>
                  <div className="replica-bar" />
                  <div className="replica-bar" style={{ width: "92%" }} />
                  <div className="replica-bar-short" />
                  <div className="replica-stat-pills">
                    <span className="replica-stat-pill">&bull; Distribution Health: 38/100 (Decoupled)</span>
                    <span className="replica-stat-pill">&bull; Target Recovery: 72-Hour Runbook</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="email-signature-replica">
                <div className="email-meta-line">
                  <div className="email-field-row">
                    <span className="email-field-tag">To:</span>
                    <span className="email-field-val">client-team@brandaccount.com</span>
                  </div>
                  <div className="email-field-row">
                    <span className="email-field-tag">Subject:</span>
                    <span className="email-field-val email-subject-val">
                      Algorithmic Anomaly Diagnostic &amp; 72h Turnaround // @client_account
                    </span>
                  </div>
                </div>
                <div className="email-body-snippet">
                  &ldquo;...Our Sentinel diagnostic radar detected an Explore Feed Decoupling pattern over the last 14 days. We have analyzed the variance against peer benchmark distributions and initiated our 72-hour turnaround protocol to reset content indexing...&rdquo;
                </div>
                <div className="email-signoff-block">
                  <div className="signoff-avatar-row">
                    <div className="signoff-avatar" title={auditor || "Auditor"}>
                      {auditorInitials}
                    </div>
                    <div>
                      <div className="signoff-name">{auditor || "Your Name"}</div>
                      <div className="signoff-role">{role || "Strategist"} &bull; {agency || "Your Agency"}</div>
                      <div className="signoff-contact">{contact || "audit@youragency.com"} &bull; Forensic Incident Protocol v1.2.0</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="preview-explainer-box">
              <span className="explainer-icon">🔒</span>
              <p className="explainer-text">
                <strong>Workspace Isolated:</strong> All co-branding persists securely in your local browser storage. When exporting client PDF memos or querying the AI Growth Analyst, Relvnt signs all output under your agency credentials.
              </p>
            </div>
          </div>

          {/* FULL-WIDTH FOOTER ACTIONS */}
          <div className="branding-modal-footer form-group-full">
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
              <button
                type="submit"
                className={`btn-primary btn-save-branding ${savedSuccess ? "btn-save-success" : ""}`}
              >
                {savedSuccess ? "✓ Applied!" : "✓ Save & Apply Agency Branding"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

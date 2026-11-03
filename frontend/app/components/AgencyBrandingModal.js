"use client";

import { useState } from "react";

export default function AgencyBrandingModal({
  isOpen,
  onClose,
  currentAgencyName,
  currentAuditorName,
  currentAgencyRole,
  onSave,
}) {
  const [agency, setAgency] = useState(currentAgencyName || "Your Agency");
  const [auditor, setAuditor] = useState(currentAuditorName || "Lead Strategist");
  const [role, setRole] = useState(currentAgencyRole || "Growth & Retention Director");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      agencyName: agency.trim() || "Relvnt Agency Partner",
      auditorName: auditor.trim() || "Lead Growth Strategist",
      agencyRole: role.trim() || "Growth Director",
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Agency White-Label Branding</h2>
            <p className="modal-subtitle">
              Configure your agency identity for official Boardroom PDF Memos and AI Analyst email drafts.
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="input-label">Agency / Firm Name</label>
            <input
              type="text"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              placeholder="e.g. K.R Digital Media"
              className="text-input"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="input-label">Lead Auditor / Founder</label>
              <input
                type="text"
                value={auditor}
                onChange={(e) => setAuditor(e.target.value)}
                placeholder="e.g. Vashu Singhal"
                className="text-input"
                required
              />
            </div>
            <div>
              <label className="input-label">Professional Title</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. CEO & Growth Strategist"
                className="text-input"
              />
            </div>
          </div>

          {/* LIVE PREVIEW OF CO-BRANDED LETTERHEAD */}
          <div className="branding-preview-card">
            <span className="branding-preview-label">Live Boardroom PDF Letterhead Preview</span>
            <div className="branding-preview-content">
              <div style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "-0.02em", color: "var(--text-title)" }}>
                RELVNT × {agency.toUpperCase() || "YOUR AGENCY"} // EXECUTIVE AUDIT
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-dim)", marginTop: "3px" }}>
                Lead Auditor: <strong>{auditor || "Your Name"}</strong> ({role || "Strategist"}) • Certified Sentinel Protocol
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Agency Branding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


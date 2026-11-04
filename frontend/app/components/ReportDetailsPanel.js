"use client";

import { useEffect, useState } from "react";
import { MAX_LOGO_BYTES, isValidGstin, loadReportDetails, saveReportDetails } from "../../lib/branding";

export default function ReportDetailsPanel() {
  const [details, setDetails] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => setDetails(loadReportDetails()), []);

  if (!details) return null;

  const update = (field) => (e) => setDetails({ ...details, [field]: e.target.value });
  const gstinOk = isValidGstin(details.gstin);

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) {
      setMessage({ type: "error", text: "Use a PNG, JPG, SVG or WebP image." });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setMessage({ type: "error", text: "Logo must be under 300 KB. A simple PNG or SVG works best." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDetails((d) => ({ ...d, logo: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!gstinOk) return;
    try {
      saveReportDetails({ ...details, gstin: details.gstin.trim().toUpperCase() });
      setMessage({ type: "success", text: "Saved. These details now appear on every report." });
    } catch {
      setMessage({ type: "error", text: "Couldn't save in this browser. Try a smaller logo." });
    }
  };

  return (
    <div className="settings-panel">
      <h3 className="section-title">Report details</h3>
      <p className="section-subtitle">Shown on every client report you export, so it looks like it came from your business.</p>

      <form onSubmit={handleSave} className="report-details-form">
        <div className="logo-field">
          <div className="logo-preview">
            {details.logo ? <img src={details.logo} alt="Your logo" /> : <span>No logo</span>}
          </div>
          <div>
            <label className="btn-secondary btn-sm logo-upload">
              {details.logo ? "Replace logo" : "Upload logo"}
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogo} />
            </label>
            {details.logo && (
              <button type="button" className="link-button logo-remove" onClick={() => setDetails({ ...details, logo: "" })}>
                Remove
              </button>
            )}
            <p className="dialog-hint">PNG, JPG or SVG, under 300 KB. A wide logo on a transparent background looks best.</p>
          </div>
        </div>

        <label className="field-label" htmlFor="rd-address">Business address</label>
        <input id="rd-address" className="text-input" value={details.address} onChange={update("address")} placeholder="12 MG Road, Pune 411001" />

        <div className="field-pair">
          <div>
            <label className="field-label" htmlFor="rd-phone">Phone / WhatsApp</label>
            <input id="rd-phone" className="text-input" value={details.phone} onChange={update("phone")} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="field-label" htmlFor="rd-website">Website</label>
            <input id="rd-website" className="text-input" value={details.website} onChange={update("website")} placeholder="youragency.in" />
          </div>
        </div>

        <label className="field-label" htmlFor="rd-gstin">
          GSTIN <span className="field-optional">(optional, only if you are registered)</span>
        </label>
        <input
          id="rd-gstin"
          className="text-input"
          value={details.gstin}
          onChange={update("gstin")}
          placeholder="27ABCDE1234F1Z5"
          aria-invalid={!gstinOk}
        />
        {!gstinOk && <p className="field-error">That doesn&apos;t look like a valid 15-character GSTIN.</p>}

        <div className="report-details-actions">
          <button type="submit" className="btn-primary" disabled={!gstinOk}>
            Save report details
          </button>
          {message && <span className={message.type === "error" ? "field-error" : "field-success"}>{message.text}</span>}
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { MAX_REPORT_FINDINGS, MAX_REPORT_STEPS, defaultReportContent } from "../../lib/report";

// Review and edit the report before exporting. The engine does the analysis;
// the person sending the report has the final say on the wording.
export default function ReportEditor({ data, initial, auditorName, onCancel, onExport }) {
  const generated = defaultReportContent(data);
  const [content, setContent] = useState(initial || generated);
  const edited = JSON.stringify(content) !== JSON.stringify(generated);

  const set = (field, value) => setContent({ ...content, [field]: value });
  const updateItem = (field, i, key) => (e) =>
    set(field, content[field].map((item, idx) => (idx === i ? { ...item, [key]: e.target.value } : item)));
  const removeItem = (field, i) => set(field, content[field].filter((_, idx) => idx !== i));
  const addItem = (field, blank) => set(field, [...content[field], blank]);

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog dialog-wide" role="dialog" aria-modal="true" aria-labelledby="review-title" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 id="review-title" className="section-title">Review report</h2>
          <button className="dialog-close" onClick={onCancel} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="dialog-text">
          Edit anything before exporting. The generated numbers come straight from the data, so if you change a number,
          make sure it&apos;s still correct.
        </p>

        <label className="field-label" htmlFor="rv-summary">Summary</label>
        <textarea id="rv-summary" className="text-input editor-textarea" rows={4} value={content.summary} onChange={(e) => set("summary", e.target.value)} />

        <div className="editor-section">
          <div className="editor-section-head">
            <span className="field-label">What we found</span>
            {content.findings.length < MAX_REPORT_FINDINGS && (
              <button type="button" className="link-button" onClick={() => addItem("findings", { title: "", detail: "" })}>
                Add a finding
              </button>
            )}
          </div>
          {content.findings.length === 0 && <p className="dialog-hint">No findings. Add one, or leave this section out.</p>}
          {content.findings.map((f, i) => (
            <div key={i} className="editor-item">
              <input className="text-input" value={f.title} onChange={updateItem("findings", i, "title")} placeholder="Short title" aria-label={`Finding ${i + 1} title`} />
              <textarea className="text-input editor-textarea" rows={2} value={f.detail} onChange={updateItem("findings", i, "detail")} placeholder="What the numbers show" aria-label={`Finding ${i + 1} detail`} />
              <button type="button" className="link-button editor-remove" onClick={() => removeItem("findings", i)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="editor-section">
          <div className="editor-section-head">
            <span className="field-label">Recommended actions</span>
            {content.steps.length < MAX_REPORT_STEPS && (
              <button type="button" className="link-button" onClick={() => addItem("steps", { title: "", action: "" })}>
                Add an action
              </button>
            )}
          </div>
          {content.steps.map((s, i) => (
            <div key={i} className="editor-item">
              <input className="text-input" value={s.title} onChange={updateItem("steps", i, "title")} placeholder="Short title" aria-label={`Action ${i + 1} title`} />
              <textarea className="text-input editor-textarea" rows={2} value={s.action} onChange={updateItem("steps", i, "action")} placeholder="What to do" aria-label={`Action ${i + 1} detail`} />
              <button type="button" className="link-button editor-remove" onClick={() => removeItem("steps", i)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <label className="field-label" htmlFor="rv-note">
          Note from {auditorName} <span className="field-optional">(optional, printed above your signature)</span>
        </label>
        <textarea
          id="rv-note"
          className="text-input editor-textarea"
          rows={3}
          value={content.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="e.g. Happy to walk you through this on a quick call this week."
        />

        <div className="editor-footer">
          {edited && (
            <button type="button" className="link-button" onClick={() => setContent(generated)}>
              Reset to generated
            </button>
          )}
          <span className="editor-footer-spacer" />
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={() => onExport(content)}>
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

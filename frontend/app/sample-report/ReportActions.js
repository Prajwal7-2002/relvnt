"use client";

export default function ReportActions() {
  return (
    <button type="button" className="site-btn site-btn-secondary" onClick={() => window.print()}>
      Download as PDF
    </button>
  );
}

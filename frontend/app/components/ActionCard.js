"use client";

import { useState } from "react";

export default function ActionCard({ data }) {
  const [copied, setCopied] = useState(false);
  const phases = data?.protocol_phases || [];
  const metrics = data?.metrics_summary || {};
  const isRoas = data?.metric_type === "roas";

  const targetAccount = data?.account_name || data?.username || "Account";
  const platform = (data?.platform || "Platform").toUpperCase();

  const generateCleanTextBrief = () => {
    return `RELVNT PERFORMANCE SUMMARY & TURNAROUND PLAN
Account: ${targetAccount} (${platform})
Health Score: ${data?.health_score || 0}/100

SITUATION SUMMARY:
${data?.diagnosis || "Performance shift detected relative to baseline expectations."}

72-HOUR ACTION PLAN:
${
  phases.length > 0
    ? phases
        .map(
          (p, idx) =>
            `Step ${idx + 1} (${p.phase || "Day " + (idx + 1)}): ${p.title}\n${p.action}`
        )
        .join("\n\n")
    : data?.recommended_action || "Maintain current publishing parameters."
}

KEY METRICS:
- Current Velocity: ${metrics.current_value || 0}${isRoas ? "x" : " views/day"}
- Expected Baseline: ${metrics.baseline_avg || 0}${isRoas ? "x" : " views/day"}
- Net Change: ${metrics.change_pct || 0}%
${metrics.projected_impact ? `- 7-Day Estimated Impact: ${metrics.projected_impact}` : ""}
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateCleanTextBrief());
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const handleDownloadMarkdown = () => {
    const text = generateCleanTextBrief();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relvnt_audit_${targetAccount.replace(/[^a-zA-Z0-9_\-]/g, "_")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="action-plan-card">
      <div className="plan-header">
        <div className="plan-title-area">
          <h2>Recommended 72-Hour Turnaround Plan</h2>
          <p>
            Concrete steps to recover algorithmic distribution and reset viewer completion signals.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleCopy} className="btn-secondary">
            {copied ? "✓ Copied to Clipboard" : "Copy Brief"}
          </button>
          <button onClick={handleDownloadMarkdown} className="btn-secondary" title="Download clean Markdown brief">
            Download Brief (.md)
          </button>
        </div>
      </div>

      <div className="plan-steps-grid">
        {phases.length > 0 ? (
          phases.map((p, idx) => (
            <div key={idx} className="plan-step-box">
              <span className="step-day-badge">
                {idx === 0 ? "Day 1 (0–24h)" : idx === 1 ? "Day 2 (24–48h)" : "Day 3 (48–72h)"}
              </span>
              <h3 className="step-title">{p.title}</h3>
              <p className="step-description">{p.action}</p>
            </div>
          ))
        ) : (
          <div className="plan-step-box" style={{ gridColumn: "span 3" }}>
            <span className="step-day-badge" style={{ color: "var(--status-nominal)", background: "var(--status-nominal-bg)" }}>
              Maintain Status
            </span>
            <h3 className="step-title">Normal Operations</h3>
            <p className="step-description">
              {data?.recommended_action || "Account distribution metrics remain within healthy baseline ranges."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

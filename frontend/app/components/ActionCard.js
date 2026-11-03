"use client";

import { useState } from "react";
import { displayName, formatMetric, platformLabel } from "../../lib/health";

export default function ActionCard({ data }) {
  const [copied, setCopied] = useState(false);
  const steps = data?.protocol_phases || [];
  const metrics = data?.metrics_summary || {};
  const metricType = data?.metric_type;
  const account = displayName(data?.account_name || data?.username || "Account");

  const buildBrief = () => {
    const plan =
      steps.length > 0
        ? steps.map((s, i) => `${i + 1}. Day ${i + 1}: ${s.title}\n   ${s.action}`).join("\n\n")
        : data?.recommended_action || "No changes needed. Keep the current schedule.";
    return `${account} (${platformLabel(data?.platform)}): performance summary
Health score: ${data?.health_score ?? 0}/100

What happened
${data?.diagnosis || "Performance shifted relative to its usual level."}

Key numbers
- Recent 7-day average: ${formatMetric(metrics.recent_avg ?? metrics.current_value, metricType)}
- Usual for this period: ${formatMetric(metrics.baseline_avg, metricType)}
- Change: ${Number(metrics.change_pct || 0).toFixed(1)}%

What to do next
${plan}
`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildBrief());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([buildBrief()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relvnt-${account.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="section-title">What to do next</h2>
          <p className="section-subtitle">Suggested steps for the next three days.</p>
        </div>
        <div className="panel-actions">
          <button onClick={handleCopy} className="btn-secondary btn-sm">
            {copied ? "Copied" : "Copy summary"}
          </button>
          <button onClick={handleDownload} className="btn-secondary btn-sm">
            Download
          </button>
        </div>
      </div>

      {steps.length > 0 ? (
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={i} className="step">
              <span className="step-number">{i + 1}</span>
              <div>
                <div className="step-day">Day {i + 1}</div>
                <h3 className="step-heading">{s.title}</h3>
                <p className="step-body">{s.action}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="panel-text">{data?.recommended_action || "No changes needed. Keep the current schedule."}</p>
      )}
    </section>
  );
}

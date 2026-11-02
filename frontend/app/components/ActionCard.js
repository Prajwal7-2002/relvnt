"use client";

import { useState } from "react";

function alertColor(alertLevel) {
  if (alertLevel === "green") return "#10B981";
  if (alertLevel === "yellow") return "#F59E0B";
  return "#F43F5E";
}

export default function ActionCard({ data }) {
  const [copied, setCopied] = useState(false);
  const color = alertColor(data.alert_level);
  const confidence = Math.round(Number(data.confidence || 0) * 100);
  const metrics = data.metrics_summary || {};

  const handleCopyBrief = () => {
    const brief = `🚨 [RELVNT EXECUTIVE INCIDENT BRIEF]
Client/Account: ${data.account_name || "Account"} (${String(data.platform || "").toUpperCase()})
Metric Evaluated: ${String(data.metric_type || "reach").toUpperCase()}
Status: ${String(data.prediction || "").toUpperCase().replace("_", " ")} (Health Score: ${data.health_score}/100)

🔍 ROOT-CAUSE DIAGNOSIS:
${data.diagnosis || "Performance shift detected relative to baseline."}

📋 72-HOUR ACTION PROTOCOL:
${data.recommended_action || "Maintain current publishing velocity."}

📊 METRICS SUMMARY:
• Current Value: ${metrics.current_value || 0}${data.metric_type === "roas" ? "x" : ""}
• Baseline Avg: ${metrics.baseline_avg || 0}${data.metric_type === "roas" ? "x" : ""}
• Net Velocity Shift: ${metrics.change_pct || 0}%
• Statistical Deviation: ${metrics.z_score_deviation || 0}σ
${metrics.projected_impact ? `• Impact Risk: ${metrics.projected_impact}` : ""}`;

    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="action-card" style={{ borderLeftColor: color }}>
      <div className="action-card-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="section-label">Root-Cause Intelligence</span>
            {data.ai_engine && (
              <span className="ai-engine-pill">
                ✨ {data.ai_engine}
              </span>
            )}
          </div>
          <h2>Executive Diagnosis & Action Protocol</h2>
        </div>
        <div className="action-header-right">
          <button onClick={handleCopyBrief} className="btn-copy">
            {copied ? "✓ Copied to Clipboard" : "📋 Copy Client Brief for Slack"}
          </button>
          <span className="confidence-pill">Confidence: {confidence}%</span>
        </div>
      </div>

      <div className="action-card-grid">
        <div className="diagnosis-box">
          <p className="diagnosis-title">🔍 Algorithmic Root-Cause Diagnosis</p>
          <p className="diagnosis-text">{data.diagnosis}</p>
        </div>

        <div className="action-box">
          <p className="action-title">📋 72-Hour Tactical Recovery Protocol</p>
          <p className="action-text">{data.recommended_action}</p>
        </div>
      </div>

      {metrics.projected_impact && (
        <div className="projected-impact-bar">
          <span>⚠️ Financial / Distribution Risk:</span>
          <span>{metrics.projected_impact}</span>
        </div>
      )}
    </section>
  );
}

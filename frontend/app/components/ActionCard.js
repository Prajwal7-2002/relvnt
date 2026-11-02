"use client";

import { useState } from "react";

function alertColor(alertLevel) {
  if (alertLevel === "green") return "#10B981";
  if (alertLevel === "yellow") return "#F59E0B";
  return "#EF4444";
}

export default function ActionCard({ data }) {
  const [copied, setCopied] = useState(false);
  const color = alertColor(data.alert_level);
  const confidence = Math.round(Number(data.confidence || 0) * 100);
  const metrics = data.metrics_summary || {};

  const handleCopyBrief = () => {
    const brief = `🚨 [RELVNT INCIDENT BRIEF: ${data.account_name || "Client Account"}]
Status: ${String(data.prediction || "").toUpperCase().replace("_", " ")} (Health Score: ${data.health_score}/100)
Metric Evaluated: ${String(data.metric_type || "reach").toUpperCase()} on ${String(data.platform || "Platform").toUpperCase()}

🔍 ROOT-CAUSE DIAGNOSIS:
${data.diagnosis || "Performance variance detected relative to historical baseline."}

📋 ACTION PLAYBOOK:
${data.recommended_action || "Maintain current posting cadence and review content engagement."}

Model Confidence: ${confidence}% | Recent Change: ${metrics.change_pct || 0}%`;

    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="action-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="action-card-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="section-label">Root-Cause Intelligence</span>
            {data.ai_engine && (
              <span style={{ fontSize: "11px", color: "#60A5FA", background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)", padding: "2px 7px", borderRadius: "5px" }}>
                ✨ {data.ai_engine}
              </span>
            )}
          </div>
          <h2>Diagnosis & Action Protocol</h2>
        </div>
        <div className="action-header-right">
          <button onClick={handleCopyBrief} className="btn-copy">
            {copied ? "✓ Copied to Clipboard" : "📋 Copy Client Brief for Slack"}
          </button>
          <span className="confidence-pill">Confidence: {confidence}%</span>
        </div>
      </div>

      {data.diagnosis && (
        <div className="diagnosis-box">
          <p className="diagnosis-title">🔍 Algorithmic Diagnosis:</p>
          <p className="diagnosis-text">{data.diagnosis}</p>
        </div>
      )}

      <div className="action-box">
        <p className="action-title">📋 72-Hour Recommended Protocol:</p>
        <p className="action-text">{data.recommended_action}</p>
      </div>

      {metrics.current_value !== undefined && (
        <div className="metrics-strip">
          <div className="metric-item">
            <span className="metric-label">Current Value</span>
            <span className="metric-num">
              {Number(metrics.current_value).toLocaleString()}
              {data.metric_type === "roas" ? "x" : ""}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">14D Baseline Avg</span>
            <span className="metric-num">
              {Number(metrics.baseline_avg).toLocaleString()}
              {data.metric_type === "roas" ? "x" : ""}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Shift vs Baseline</span>
            <span
              className="metric-num"
              style={{ color: Number(metrics.change_pct) < 0 ? "#EF4444" : "#10B981" }}
            >
              {Number(metrics.change_pct) > 0 ? "+" : ""}
              {metrics.change_pct}%
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Anomaly Outliers</span>
            <span className="metric-num">{metrics.anomaly_count || 0}</span>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";

function getSeverityColor(severity) {
  if (severity === "NOMINAL_EQUILIBRIUM") return "#10B981";
  if (severity === "ELEVATED_RISK" || severity === "RECOVERY_PHASE") return "#F59E0B";
  return "#F43F5E";
}

export default function ActionCard({ data }) {
  const [copied, setCopied] = useState(false);
  const severity = data.severity || (data.alert_level === "red" ? "CRITICAL_DRIFT" : "NOMINAL_EQUILIBRIUM");
  const color = getSeverityColor(severity);
  const metrics = data.metrics_summary || {};
  const isRoas = data.metric_type === "roas";
  const phases = data.protocol_phases || [];

  const accountClean = (data.account_name || "Target Account").replace(/[^a-zA-Z0-9_-]/g, "_");
  const incidentId = `INC-${new Date().getFullYear()}-${accountClean.slice(0, 12).toUpperCase()}`;

  const generateBriefMarkdown = () => {
    return `[RELVNT EXECUTIVE STRATEGY BRIEF]
Incident Ref: ${incidentId}
Target Account: ${data.account_name || "Account"} (${String(data.platform || "").toUpperCase()})
Channel Focus: ${String(data.metric_type || "reach").toUpperCase()}
Relvnt Score: ${data.health_score}/100 (${severity.replace(/_/g, " ")})
Intelligence Engine: ${data.ai_engine || "Relvnt Compound AI Engine"}

01. ALGORITHMIC ROOT-CAUSE ANALYSIS:
${data.diagnosis || "Performance shift detected relative to baseline."}

02. 72-HOUR TACTICAL TURNAROUND PROTOCOL:
${phases.length > 0
  ? phases.map((p) => `• ${p.phase} - ${p.title}:\n  ${p.action}`).join("\n\n")
  : data.recommended_action || "Maintain current publishing parameters."}

03. TELEMETRY & VELOCITY RUN-RATE:
• Current Run-Rate: ${metrics.current_value || 0}${isRoas ? "x" : ""}
• Model Baseline: ${metrics.baseline_avg || 0}${isRoas ? "x" : ""}
• Net Velocity Drift: ${metrics.change_pct || 0}%
• Statistical Deviation: ${metrics.z_score_deviation || 0}σ
• IsolationForest ML Outlier Risk: ${Math.round((metrics.ml_anomaly_score || 0.1) * 100)}%
${metrics.projected_impact ? `• 7-Day At-Risk Deficit: ${metrics.projected_impact}` : ""}

[DATA GOVERNANCE: On-premise execution. Zero cloud training.]`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateBriefMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const text = generateBriefMarkdown();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${incidentId}-executive-brief.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="action-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="action-card-header">
        <div>
          <div className="incident-meta-row">
            <span className="incident-badge">{incidentId}</span>
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                color: color,
                backgroundColor: `${color}18`,
                border: `1px solid ${color}35`,
                padding: "3px 9px",
                borderRadius: "4px",
              }}
            >
              {severity.replace(/_/g, " ")}
            </span>
            <span className="ai-engine-tag">{data.ai_engine?.includes("Gemini") ? "Gemini 1.5 Flash AI" : "Compound AI Engine"}</span>
          </div>
          <h2>Strategic Diagnosis &amp; Tactical Turnaround Plan</h2>
        </div>

        <div className="action-header-right">
          <button onClick={handleCopy} className="btn-export-primary">
            {copied ? "✓ Copied to Clipboard" : "Copy Client Brief"}
          </button>
          <button onClick={handleDownload} className="btn-export-secondary">
            Export .txt
          </button>
        </div>
      </div>

      <div className="action-card-grid">
        {/* RCA Box */}
        <div className="rca-section">
          <p className="rca-section-title">Algorithmic Root-Cause Inference</p>
          <p className="rca-body-text">{data.diagnosis}</p>
        </div>

        {/* Tactical Phased Runbook */}
        <div className="rca-section">
          <p className="rca-section-title">72-Hour Tactical Turnaround Plan</p>
          {phases.length > 0 ? (
            <div className="phases-container">
              {phases.map((item, idx) => (
                <div key={idx} className="phase-card">
                  <div className="phase-header-row">
                    <span className="phase-step-pill">{item.phase}</span>
                    <span className="phase-title">{item.title}</span>
                  </div>
                  <p className="phase-action-text">{item.action}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rca-body-text" style={{ whiteSpace: "pre-line" }}>
              {data.recommended_action}
            </div>
          )}
        </div>
      </div>

      {metrics.projected_impact && (
        <div className="projected-impact-bar">
          <span style={{ fontWeight: 600 }}>At-Risk Velocity &amp; Capital Deficit:</span>
          <span className="tabular-nums" style={{ fontWeight: 600 }}>{metrics.projected_impact}</span>
        </div>
      )}

      {copied && (
        <div className="toast-notice">
          <span style={{ color: "#10B981" }}>✓</span> Executive brief copied to clipboard. Ready for Slack, WhatsApp, or email.
        </div>
      )}
    </section>
  );
}

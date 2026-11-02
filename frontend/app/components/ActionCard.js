"use client";

import { useState } from "react";

function getSeverityColor(severity) {
  if (severity === "NOMINAL_EQUILIBRIUM") return "#10B981";
  if (severity === "ELEVATED_RISK" || severity === "RECOVERY_PHASE") return "#F59E0B";
  return "#EF4444";
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
    return `[RELVNT QUANTITATIVE INCIDENT BRIEF]
Incident Ref: ${incidentId}
Target Account: ${data.account_name || "Account"} (${String(data.platform || "").toUpperCase()})
Channel Metric: ${String(data.metric_type || "reach").toUpperCase()}
Status: ${severity} (Health Score: ${data.health_score}/100)
Evaluation Engine: ${data.ai_engine || "Relvnt Local Statistical Engine"}

01. ROOT CAUSE INFERENCE:
${data.diagnosis || "Performance shift detected relative to baseline."}

02. 72-HOUR TACTICAL RECOVERY RUNBOOK:
${phases.length > 0
  ? phases.map((p) => `• [${p.phase}] ${p.title}:\n  ${p.action}`).join("\n\n")
  : data.recommended_action || "Maintain current publishing parameters."}

03. TELEMETRY & RUN-RATE:
• Current Run-Rate: ${metrics.current_value || 0}${isRoas ? "x" : ""}
• Baseline Expected: ${metrics.baseline_avg || 0}${isRoas ? "x" : ""}
• Net Velocity Shift: ${metrics.change_pct || 0}%
• Statistical Divergence: ${metrics.z_score_deviation || 0} std dev
${metrics.projected_impact ? `• 7-Day At-Risk Deficit: ${metrics.projected_impact}` : ""}

[DATA GOVERNANCE: On-premise execution. Zero egress payloads transmitted.]`;
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
    link.download = `${incidentId}-brief.txt`;
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
            <span className="incident-id-tag">{incidentId}</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 600,
                color: color,
                background: `${color}15`,
                border: `1px solid ${color}35`,
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              [{severity}]
            </span>
            <span className="ai-engine-tag">LOCAL_ENCLAVE</span>
          </div>
          <h2>Algorithmic Root-Cause Analysis &amp; Action Runbook</h2>
        </div>

        <div className="action-header-right">
          <button onClick={handleCopy} className="btn-export btn-export-primary">
            {copied ? "[✓ COPIED]" : "[COPY SLACK/EMAIL BRIEF]"}
          </button>
          <button onClick={handleDownload} className="btn-export">
            [EXPORT .TXT]
          </button>
        </div>
      </div>

      <div className="action-card-grid">
        {/* RCA Box */}
        <div className="rca-section">
          <p className="rca-section-title">01 // Algorithmic Root-Cause Inference</p>
          <p className="rca-body-text">{data.diagnosis}</p>
        </div>

        {/* Tactical Phased Runbook */}
        <div className="rca-section">
          <p className="rca-section-title">02 // 72-Hour Tactical Remediation Protocol</p>
          {phases.length > 0 ? (
            <div className="phases-container">
              {phases.map((item, idx) => (
                <div key={idx} className="phase-block">
                  <div className="phase-label-row">
                    <span className="phase-tag">{item.phase}</span>
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
          <span>[IMPACT_VECTOR]: At-Risk Velocity / Spend Efficiency</span>
          <span>{metrics.projected_impact}</span>
        </div>
      )}

      {copied && (
        <div className="toast-notice">
          <span>✓</span> Incident brief copied to clipboard in clean Markdown.
        </div>
      )}
    </section>
  );
}

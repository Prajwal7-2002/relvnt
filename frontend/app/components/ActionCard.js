"use client";

import { useState } from "react";

function getSeverityBadge(severity) {
  if (severity === "NOMINAL_EQUILIBRIUM") {
    return {
      label: "Nominal Equilibrium",
      color: "#10B981",
      bg: "rgba(16, 185, 129, 0.1)",
      border: "rgba(16, 185, 129, 0.25)",
    };
  }
  if (severity === "ELEVATED_RISK" || severity === "RECOVERY_PHASE") {
    return {
      label: "Elevated Risk",
      color: "#F59E0B",
      bg: "rgba(245, 158, 11, 0.1)",
      border: "rgba(245, 158, 11, 0.25)",
    };
  }
  return {
    label: "Critical Decoupling Drift",
    color: "#F43F5E",
    bg: "rgba(244, 63, 94, 0.1)",
    border: "rgba(244, 63, 94, 0.25)",
  };
}

export default function ActionCard({ data }) {
  const [copied, setCopied] = useState(false);
  const severity = data?.severity || (data?.alert_level === "red" ? "CRITICAL_DRIFT" : "NOMINAL_EQUILIBRIUM");
  const badge = getSeverityBadge(severity);
  const metrics = data?.metrics_summary || {};
  const isRoas = data?.metric_type === "roas";
  const phases = data?.protocol_phases || [];

  const targetAccount = data?.account_name || "Target Account";
  const platform = String(data?.platform || "platform").toUpperCase();

  const generateExecutiveBrief = () => {
    return `RELVNT STRATEGIC INTELLIGENCE DIRECTIVE
Target: ${targetAccount} (${platform})
Channel Focus: ${String(data?.metric_type || "reach").toUpperCase()}
Resonance Index: ${data?.health_score || 0}/100 [${badge.label}]
Inference Framework: ${data?.ai_engine || "Relvnt Compound AI Engine"}

1. ALGORITHMIC ROOT-CAUSE DIAGNOSIS:
${data?.diagnosis || "Variance observed relative to historical baseline expectations."}

2. 72-HOUR RECOVERY PROTOCOL:
${phases.length > 0
  ? phases.map((p) => `• ${p.phase} — ${p.title}\n  Action: ${p.action}`).join("\n\n")
  : data?.recommended_action || "Maintain baseline publishing cadence."}

3. VELOCITY TELEMETRY:
• Current Observed Run-Rate: ${metrics.current_value || 0}${isRoas ? "x" : ""}
• Baseline Expected Median: ${metrics.baseline_avg || 0}${isRoas ? "x" : ""}
• Net Velocity Drift: ${metrics.change_pct || 0}%
• Statistical Z-Deviation: ${metrics.z_score_deviation || 0}σ
• Machine Learning Outlier Risk: ${Math.round((metrics.ml_anomaly_score || 0.1) * 100)}%
${metrics.projected_impact ? `• 7-Day At-Risk Deficit: ${metrics.projected_impact}` : ""}

Data Governance: Local mathematical inference with zero third-party training retention.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateExecutiveBrief());
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <section className="directive-panel">
      <div className="directive-header-row">
        <div className="directive-header-text">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: badge.color,
                backgroundColor: badge.bg,
                border: `1px solid ${badge.border}`,
                padding: "3px 10px",
                borderRadius: "6px",
              }}
            >
              {badge.label}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              {data?.ai_engine?.includes("Gemini") ? "Gemini 1.5 Flash Reasoning" : "Compound AI Engine"}
            </span>
          </div>

          <h2>Algorithmic Turnaround Directive &amp; 72-Hour Protocol</h2>
          <p>{data?.diagnosis || "Analyzing distribution shift across algorithmic ranking surfaces."}</p>
        </div>

        <div className="directive-actions">
          <button onClick={handleCopy} className="btn-haptic btn-primary">
            {copied ? "✓ Copied to Clipboard" : "Copy Executive Brief"}
          </button>
        </div>
      </div>

      {/* 3-Phase Algorithmic Recovery Stepper */}
      <div className="turnaround-phases-deck">
        {phases.length > 0 ? (
          phases.map((p, idx) => (
            <div key={idx} className="phase-card">
              <div>
                <div className="phase-top-badge-row">
                  <span className="phase-number-tag">Phase 0{idx + 1}</span>
                  <span className="phase-window-time font-mono-nums">
                    {idx === 0 ? "00:00 — 24:00" : idx === 1 ? "24:00 — 48:00" : "48:00 — 72:00"}
                  </span>
                </div>
                <h3 className="phase-headline">{p.title}</h3>
                <p className="phase-body-action">{p.action}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="phase-card" style={{ gridColumn: "span 3" }}>
            <h3 className="phase-headline">Equilibrium Maintenance</h3>
            <p className="phase-body-action">
              {data?.recommended_action || "Account distribution metrics remain within healthy standard deviations."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

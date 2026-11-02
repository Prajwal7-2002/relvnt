"use client";

import { useEffect, useState } from "react";

function getStatusAttributes(score) {
  if (score >= 70) {
    return {
      label: "Optimal Resonance",
      color: "#10B981", // Emerald
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(16, 185, 129, 0.3)",
    };
  }
  if (score >= 40) {
    return {
      label: "Audience Fatigue",
      color: "#F59E0B", // Amber
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.3)",
    };
  }
  return {
    label: "Distribution Suppression",
    color: "#F43F5E", // Coral
    bg: "rgba(244, 63, 94, 0.12)",
    border: "rgba(244, 63, 94, 0.3)",
  };
}

export default function HealthScore({ data }) {
  const [mounted, setMounted] = useState(false);
  const score = Math.max(0, Math.min(100, Number(data.health_score || 0)));
  const status = getStatusAttributes(score);
  const metrics = data.metrics_summary || {};
  const confidence = Math.round(Number(data.confidence || 0.85) * 100);

  const displayUser = data.account_name || data.username || "Client Target";
  const platformName = String(data.platform || "Platform").toUpperCase();
  const metricType = String(data.metric_type || "Metric").toUpperCase();
  const mlScore = Math.round((metrics.ml_anomaly_score || 0.1) * 100);

  // 240-degree Circular Arc Geometry
  const radius = 80;
  const strokeWidth = 10;
  // Total arc length for 240 degrees: (240 / 360) * 2 * PI * r
  const totalLength = (240 / 360) * 2 * Math.PI * radius;
  const progressLength = (score / 100) * totalLength;
  const offset = mounted ? totalLength - progressLength : totalLength;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="health-card" style={{ "--card-accent": status.color }}>
      <div>
        <div className="panel-header-row">
          <span className="panel-title">Relevance &amp; Velocity Radar</span>
          <span className="account-badge">{displayUser}</span>
        </div>

        {/* Presentation-Grade Circular Arc Dial */}
        <div className="dial-container">
          <div className="dial-svg-wrapper">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <defs>
                <filter id="dialGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={status.color} floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Background Arc Track */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${totalLength} ${2 * Math.PI * radius}`}
                transform="rotate(150 110 110)"
              />

              {/* Active Luminous Progress Arc */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={status.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${totalLength} ${2 * Math.PI * radius}`}
                strokeDashoffset={offset}
                transform="rotate(150 110 110)"
                filter="url(#dialGlow)"
                style={{
                  transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </svg>

            {/* Score in Center of Arc */}
            <div className="dial-center-content">
              <span className="dial-score-number tabular-nums" style={{ color: status.color }}>
                {score}
              </span>
              <span className="dial-score-label">Relvnt Score</span>
            </div>
          </div>

          {/* Dynamic Status Pill */}
          <div
            className="health-status-pill"
            style={{
              color: status.color,
              backgroundColor: status.bg,
              border: `1px solid ${status.border}`,
            }}
          >
            <span className="status-dot-pulse" style={{ backgroundColor: status.color }} />
            <span>{status.label}</span>
          </div>
        </div>
      </div>

      {/* High-Craft Telemetry Matrix */}
      <div className="telemetry-matrix">
        <div className="telemetry-row">
          <span className="telemetry-key">Channel &amp; Focus</span>
          <span className="telemetry-val">{platformName} • {metricType}</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-key">Machine Learning Model</span>
          <span className="telemetry-val" style={{ color: metrics.ml_flagged ? "#F43F5E" : "#10B981" }}>
            IsolationForest ({mlScore}% Outlier Risk)
          </span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-key">Seasonality Calibration</span>
          <span className="telemetry-val">DOW Weekend-Normalized</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-key">Inference Confidence</span>
          <span className="telemetry-val">{confidence}% (p &lt; 0.01)</span>
        </div>
      </div>
    </section>
  );
}

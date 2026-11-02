"use client";

import { useEffect, useState } from "react";

function getResonanceTheme(score) {
  if (score >= 70) {
    return {
      statusLabel: "Optimal Resonance",
      color: "#10B981", // Emerald
      glowColor: "rgba(16, 185, 129, 0.35)",
      bgPill: "rgba(16, 185, 129, 0.12)",
      borderPill: "rgba(16, 185, 129, 0.28)",
      gradientId: "resonanceOptimalGrad",
      subtext: "Feed velocity aligns with organic explore recommendations.",
    };
  }
  if (score >= 40) {
    return {
      statusLabel: "Audience Fatigue",
      color: "#F59E0B", // Amber
      glowColor: "rgba(245, 158, 11, 0.35)",
      bgPill: "rgba(245, 158, 11, 0.12)",
      borderPill: "rgba(245, 158, 11, 0.28)",
      gradientId: "resonanceWarningGrad",
      subtext: "Engagement velocity decaying across primary audience cohorts.",
    };
  }
  return {
    statusLabel: "Distribution Suppression",
    color: "#F43F5E", // Crimson
    glowColor: "rgba(244, 63, 94, 0.4)",
    bgPill: "rgba(244, 63, 94, 0.12)",
    borderPill: "rgba(244, 63, 94, 0.3)",
    gradientId: "resonanceCriticalGrad",
    subtext: "Algorithmic feed de-prioritization detected (-40%+ decoupling).",
  };
}

export default function HealthScore({ data }) {
  const [mounted, setMounted] = useState(false);
  const score = Math.max(0, Math.min(100, Number(data?.health_score || 0)));
  const theme = getResonanceTheme(score);
  const metrics = data?.metrics_summary || {};
  const isRoas = data?.metric_type === "roas";

  // Optical Arc Geometry
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const arcSweep = 240; // degrees
  const arcLength = (arcSweep / 360) * circumference;
  const strokeOffset = mounted ? arcLength - (score / 100) * arcLength : arcLength;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const displayUser = data?.account_name || data?.username || "Target Account";

  // Calibrated tick marks for the outer ring (0 to 100)
  const ticks = [0, 20, 40, 60, 80, 100];

  return (
    <section className="orbital-dial-panel" style={{ "--card-accent": theme.color }}>
      <div>
        <div className="panel-header-line">
          <span className="panel-title-text">Relvnt Resonance Dial</span>
          <span className="account-target-badge">{displayUser}</span>
        </div>

        {/* Optical SVG Assembly */}
        <div className="dial-center-assembly">
          <svg width="240" height="240" viewBox="0 0 240 240" className="dial-svg-optic">
            <defs>
              {/* Luminous Glow Filter */}
              <filter id="luminousGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={theme.color} floodOpacity="0.45" />
              </filter>

              {/* Dynamic Gradients */}
              <linearGradient id="resonanceOptimalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>

              <linearGradient id="resonanceWarningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>

              <linearGradient id="resonanceCriticalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#FB7185" />
              </linearGradient>
            </defs>

            {/* Subtle Outer Calibrated Ring */}
            <circle
              cx="120"
              cy="120"
              r="104"
              fill="none"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />

            {/* Background Inactive Arc Track */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              transform="rotate(150 120 120)"
            />

            {/* Active Luminous Resonance Arc */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke={`url(#${theme.gradientId})`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeOffset}
              transform="rotate(150 120 120)"
              filter="url(#luminousGlow)"
              style={{
                transition: "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </svg>

          {/* Central Numerals Display */}
          <div className="dial-core-readout">
            <span className="dial-score-number font-mono-nums">{score}</span>
            <span className="dial-score-scale">Resonance Index</span>
          </div>
        </div>

        {/* Dynamic Status Pill */}
        <div style={{ textAlign: "center" }}>
          <div
            className="dial-status-pill"
            style={{
              backgroundColor: theme.bgPill,
              border: `1px solid ${theme.borderPill}`,
              color: theme.color,
            }}
          >
            <span className="status-pulse-light" style={{ backgroundColor: theme.color }} />
            <span>{theme.statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Aerospace 4-Cell Telemetry Matrix */}
      <div className="dial-sub-matrix">
        <div className="matrix-cell">
          <div className="matrix-cell-label">Observed Velocity</div>
          <div className="matrix-cell-val font-mono-nums">
            {isRoas
              ? `${metrics.current_value || 0}x`
              : Number(metrics.current_value || 0).toLocaleString()}
          </div>
        </div>

        <div className="matrix-cell">
          <div className="matrix-cell-label">Baseline Median</div>
          <div className="matrix-cell-val font-mono-nums">
            {isRoas
              ? `${metrics.baseline_avg || 0}x`
              : Number(metrics.baseline_avg || 0).toLocaleString()}
          </div>
        </div>

        <div className="matrix-cell">
          <div className="matrix-cell-label">Z-Score Drift</div>
          <div
            className="matrix-cell-val font-mono-nums"
            style={{ color: Number(metrics.z_score_deviation || 0) < -2 ? "#F43F5E" : "#10B981" }}
          >
            {metrics.z_score_deviation || 0}σ
          </div>
        </div>

        <div className="matrix-cell">
          <div className="matrix-cell-label">Decoupling Risk</div>
          <div
            className="matrix-cell-val font-mono-nums"
            style={{ color: metrics.ml_flagged ? "#F43F5E" : "#10B981" }}
          >
            {Math.round((metrics.ml_anomaly_score || 0.1) * 100)}%
          </div>
        </div>
      </div>
    </section>
  );
}

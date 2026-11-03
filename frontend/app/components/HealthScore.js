"use client";

import { useMemo } from "react";

function getStatusDetails(score, changePct) {
  if (score >= 70) {
    return {
      label: "Optimal Reach",
      badgeColor: "var(--status-good)",
      badgeBg: "var(--status-good-bg)",
      badgeBorder: "var(--status-good-border)",
      headline: "Account performance is in healthy equilibrium.",
      summary: "Your daily delivery matches or exceeds historical benchmarks. The distribution algorithm is actively showing your content to both followers and explore audiences.",
    };
  }
  if (score >= 40) {
    return {
      label: "Audience Fatigue",
      badgeColor: "var(--status-warn)",
      badgeBg: "var(--status-warn-bg)",
      badgeBorder: "var(--status-warn-border)",
      headline: "Audience fatigue detected: Reach velocity is softening.",
      summary: "Delivery has decelerated compared to your 30-day baseline. Initial engagement velocity has slowed, causing fewer non-follower recommendations.",
    };
  }
  return {
    label: "Critical Reach Drop",
    badgeColor: "var(--status-alert)",
    badgeBg: "var(--status-alert-bg)",
    badgeBorder: "var(--status-alert-border)",
    headline: `Your reach is down ${Math.abs(changePct)}% below normal.`,
    summary: "Feed distribution dropped significantly below seasonal expectations. The algorithm has temporarily curtailed explore and non-follower recommendations due to early drop-off.",
  };
}

export default function HealthScore({ data }) {
  const score = Math.max(0, Math.min(100, Number(data?.health_score || 0)));
  const metrics = data?.metrics_summary || {};
  const isRoas = data?.metric_type === "roas";
  const changePct = Number(metrics.change_pct || 0);

  const status = useMemo(() => getStatusDetails(score, changePct), [score, changePct]);
  const accountName = data?.account_name || data?.username || "Selected Account";

  // Position for the horizontal range pin (clamped 4% to 96%)
  const pinPercent = Math.max(4, Math.min(96, score));

  return (
    <section className="executive-story-card">
      <div className="story-header-row">
        <div className="story-left">
          <div
            className="story-status-tag"
            style={{
              color: status.badgeColor,
              backgroundColor: status.badgeBg,
              border: `1px solid ${status.badgeBorder}`,
            }}
          >
            <span>●</span>
            <span>{status.label}</span>
            <span style={{ color: "var(--text-dim)", marginLeft: "4px" }}>({accountName})</span>
          </div>

          <h1 className="story-headline">{status.headline}</h1>
          <p className="story-explanation">
            {data?.diagnosis || status.summary}
          </p>
        </div>

        <div className="story-score-badge">
          <div className="mono-num">
            <span className="score-number">{score}</span>
            <span className="score-scale">/100</span>
          </div>
          <div className="score-title">Health Index</div>
        </div>
      </div>

      {/* Horizontal Resonance Range Tracker */}
      <div className="range-tracker-wrap">
        <div className="range-tracker-labels">
          <span style={{ color: "var(--status-alert)" }}>Suppressed (0–40)</span>
          <span style={{ color: "var(--status-warn)" }}>Average (40–70)</span>
          <span style={{ color: "var(--status-good)" }}>Optimal (70–100)</span>
        </div>

        <div className="range-tracker-bar">
          <div
            className="range-tracker-marker"
            style={{ left: `${pinPercent}%` }}
            title={`Current Score: ${score}/100`}
          />
        </div>
      </div>

      {/* Plain-English Quick Telemetry Strip */}
      <div className="quick-stats-row">
        <div className="quick-stat-item">
          <span className="quick-stat-label">Current Velocity</span>
          <span className="quick-stat-value mono-num">
            {isRoas ? `${metrics.current_value}x` : Number(metrics.current_value || 0).toLocaleString()}
          </span>
          <span className="quick-stat-sub">Recent 7-day average</span>
        </div>

        <div className="quick-stat-item">
          <span className="quick-stat-label">Normal Baseline</span>
          <span className="quick-stat-value mono-num">
            {isRoas ? `${metrics.baseline_avg}x` : Number(metrics.baseline_avg || 0).toLocaleString()}
          </span>
          <span className="quick-stat-sub">Historical seasonal mean</span>
        </div>

        <div className="quick-stat-item">
          <span className="quick-stat-label">Net Difference</span>
          <span
            className="quick-stat-value mono-num"
            style={{ color: changePct < 0 ? "var(--status-alert)" : "var(--status-good)" }}
          >
            {changePct > 0 ? "+" : ""}{changePct}%
          </span>
          <span className="quick-stat-sub">{metrics.z_score_deviation || 0} standard deviations</span>
        </div>

        <div className="quick-stat-item">
          <span className="quick-stat-label">Estimated Impact</span>
          <span
            className="quick-stat-value mono-num"
            style={{ fontSize: "16px", color: changePct < 0 ? "var(--status-warn)" : "inherit" }}
          >
            {metrics.projected_impact || "Nominal run-rate"}
          </span>
          <span className="quick-stat-sub">7-day projected delivery</span>
        </div>
      </div>
    </section>
  );
}

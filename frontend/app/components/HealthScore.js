"use client";

function getStatusAttributes(score) {
  if (score >= 70) {
    return {
      label: "NOMINAL_EQUILIBRIUM",
      color: "#10B981", // Emerald
      bg: "rgba(16, 185, 129, 0.10)",
      border: "rgba(16, 185, 129, 0.25)",
    };
  }
  if (score >= 40) {
    return {
      label: "ELEVATED_RISK",
      color: "#F59E0B", // Amber
      bg: "rgba(245, 158, 11, 0.10)",
      border: "rgba(245, 158, 11, 0.25)",
    };
  }
  return {
    label: "CRITICAL_DRIFT",
    color: "#EF4444", // Crimson
    bg: "rgba(239, 68, 68, 0.10)",
    border: "rgba(239, 68, 68, 0.25)",
  };
}

export default function HealthScore({ data }) {
  const score = Math.max(0, Math.min(100, Number(data.health_score || 0)));
  const status = getStatusAttributes(score);
  const activeSegments = Math.max(1, Math.round((score / 100) * 10));
  const metrics = data.metrics_summary || {};
  const confidence = Math.round(Number(data.confidence || 0.85) * 100);

  const displayUser = data.account_name || data.username || "Client Target";
  const platformName = String(data.platform || "Platform").toUpperCase();
  const metricType = String(data.metric_type || "Metric").toUpperCase();

  return (
    <section className="health-card">
      <div>
        <div className="panel-header-row">
          <span className="panel-header-tag">[RADAR // VELOCITY_INDEX]</span>
          <span className="account-badge">{displayUser}</span>
        </div>

        <div className="health-readout">
          <div className="health-score-large">
            <span className="health-number tabular-numbers" style={{ color: status.color }}>
              {score}
            </span>
            <span className="health-scale-cap">/ 100</span>
          </div>

          {/* 10-Segment Calibrated Hardware-Style Meter */}
          <div className="meter-track">
            {Array.from({ length: 10 }).map((_, i) => {
              const isActive = i < activeSegments;
              return (
                <div
                  key={i}
                  className={`meter-segment ${isActive ? "meter-segment-active" : ""}`}
                  style={{
                    backgroundColor: isActive ? status.color : undefined,
                    color: status.color,
                  }}
                />
              );
            })}
          </div>

          <div
            className="health-status-badge"
            style={{
              color: status.color,
              background: status.bg,
              border: `1px solid ${status.border}`,
            }}
          >
            <span>[{status.label}]</span>
          </div>
        </div>
      </div>

      {/* Structured Micro-Telemetry Matrix */}
      <div className="telemetry-matrix">
        <div className="telemetry-row">
          <span className="telemetry-key">PLATFORM / CHANNEL</span>
          <span className="telemetry-val">{platformName} • {metricType}</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-key">SEASONALITY FILTER</span>
          <span className="telemetry-val">DOW Normalized</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-key">OUTLIER RESISTANCE</span>
          <span className="telemetry-val">Winsorized P90 Median</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-key">VOLATILITY VECTOR</span>
          <span className="telemetry-val">{metrics.volatility_index || 0}% Volatility</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-key">INFERENCE CONFIDENCE</span>
          <span className="telemetry-val">{confidence}% (p &lt; 0.01)</span>
        </div>
      </div>
    </section>
  );
}

"use client";

import { formatMetric, healthLevel } from "../../lib/health";

function headlineFor(level, changePct) {
  const pct = Math.abs(changePct).toFixed(0);
  if (level.key === "healthy") {
    return changePct >= 1 ? `Reach is ${pct}% above usual` : "Reach is in its usual range";
  }
  return `Reach is ${pct}% below usual`;
}

export default function HealthScore({ data }) {
  const score = Math.max(0, Math.min(100, Number(data?.health_score || 0)));
  const level = healthLevel(score);
  const metrics = data?.metrics_summary || {};
  const metricType = data?.metric_type;
  const changePct = Number(metrics.change_pct || 0);

  return (
    <section className="panel summary-panel">
      <div className="summary-main">
        <div className="summary-copy">
          <span className={`health-pill health-pill-${level.key}`}>{level.label}</span>
          <h2 className="summary-headline">{headlineFor(level, changePct)}</h2>
          {data?.diagnosis && <p className="summary-text">{data.diagnosis}</p>}
        </div>

        <div className="score-block" aria-label={`Health score ${score} out of 100`}>
          <span className="score-value">{score}</span>
          <span className="score-caption">Health score</span>
        </div>
      </div>

      <div className="health-scale" aria-hidden="true">
        <div className="health-scale-track">
          <span className="health-scale-seg health-scale-critical" />
          <span className="health-scale-seg health-scale-watch" />
          <span className="health-scale-seg health-scale-healthy" />
          <span className="health-scale-marker" style={{ left: `${Math.max(1, Math.min(99, score))}%` }} />
        </div>
        <div className="health-scale-labels">
          <span>Critical</span>
          <span>Watch</span>
          <span>Healthy</span>
        </div>
      </div>

      <dl className="stat-row">
        <div className="stat">
          <dt>Recent 7-day average</dt>
          <dd>{formatMetric(metrics.recent_avg ?? metrics.current_value, metricType)}</dd>
        </div>
        <div className="stat">
          <dt>Usual for this period</dt>
          <dd>{formatMetric(metrics.baseline_avg, metricType)}</dd>
        </div>
        <div className="stat">
          <dt>Change</dt>
          <dd className={changePct < 0 ? "text-down" : "text-up"}>
            {changePct > 0 ? "+" : changePct < 0 ? "−" : ""}
            {Math.abs(changePct).toFixed(1)}%
          </dd>
        </div>
      </dl>
    </section>
  );
}

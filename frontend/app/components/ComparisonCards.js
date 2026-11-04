"use client";

import { formatMetric } from "../../lib/health";

const FORMAT_PLURAL = { Reel: "reels", Carousel: "carousels", Photo: "photos", Video: "videos" };

function Change({ before, after }) {
  if (!before) return null;
  const pct = ((after - before) / before) * 100;
  if (Math.abs(pct) < 1) return <span className="compare-change">No change</span>;
  const down = pct < 0;
  return (
    <span className={`compare-change ${down ? "text-down" : "text-up"}`}>
      {down ? "↓" : "↑"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

// Before/after for the latest period vs the one before (higher is better for all three)
export default function ComparisonCards({ comparison, compact = false }) {
  if (!comparison) return null;
  const { prior, recent, best_format, prior_label, recent_label } = comparison;
  const formatWord = FORMAT_PLURAL[best_format] || "best format";

  const cards = [
    { label: "Reach per post", before: prior.median_reach, after: recent.median_reach, format: (v) => formatMetric(v) },
    { label: "Posts per week", before: prior.posts_per_week, after: recent.posts_per_week, format: (v) => v.toFixed(1) },
  ];
  if (best_format && prior.best_format_share !== null) {
    cards.push({
      label: `Share of ${formatWord}`,
      before: prior.best_format_share,
      after: recent.best_format_share,
      format: (v) => `${Math.round(v * 100)}%`,
    });
  }

  return (
    <div className={`compare-row ${compact ? "compare-row-compact" : ""}`}>
      {cards.map((c) => (
        <div key={c.label} className="compare-card">
          <span className="compare-label">{c.label}</span>
          <div className="compare-values">
            <span className="compare-before" title={prior_label}>
              {c.format(c.before)}
            </span>
            <span className="compare-arrow" aria-hidden="true">→</span>
            <span className="compare-after" title={recent_label}>
              {c.format(c.after)}
            </span>
          </div>
          <span className="compare-foot">
            {prior_label} → {recent_label.toLowerCase()} · <Change before={c.before} after={c.after} />
          </span>
        </div>
      ))}
    </div>
  );
}

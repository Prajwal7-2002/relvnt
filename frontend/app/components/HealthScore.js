"use client";

import { useEffect, useState } from "react";

function scoreColor(score) {
  if (score >= 70) return "#10B981";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

export default function HealthScore({ data }) {
  const [mounted, setMounted] = useState(false);
  const score = Number(data.health_score || 0);
  const color = scoreColor(score);
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const offset = mounted ? circumference - (score / 100) * circumference : circumference;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const displayUser = data.account_name || data.username || "Client Account";
  const platformName = (data.platform || "Platform").toUpperCase();

  return (
    <section className="health-card">
      <div className="health-card-top">
        <span className="health-platform-tag">{platformName}</span>
        <span className="health-metric-tag">{(data.metric_type || "Metric").toUpperCase()}</span>
      </div>

      <div className="score-ring">
        <svg viewBox="0 0 220 220">
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="transparent"
            stroke="#262626"
            strokeWidth="16"
          />
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring-progress"
          />
        </svg>
        <div className="score-value">
          <span>{score}</span>
          <small>/100</small>
        </div>
      </div>

      <div className="score-details">
        <p className="score-user">{displayUser}</p>
        <p className="score-prediction-pill" style={{ color: color, borderColor: `${color}40` }}>
          {String(data.prediction || "normal").replace("_", " ").toUpperCase()}
        </p>
        <p className="score-subtext">Algorithm Health & Velocity Index</p>
      </div>
    </section>
  );
}

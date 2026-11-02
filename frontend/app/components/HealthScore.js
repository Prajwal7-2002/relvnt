"use client";

import { useEffect, useState } from "react";

function scoreColor(score) {
  if (score >= 70) return "#10B981"; // Emerald
  if (score >= 40) return "#F59E0B"; // Amber
  return "#F43F5E"; // Coral Rose
}

export default function HealthScore({ data }) {
  const [mounted, setMounted] = useState(false);
  const score = Number(data.health_score || 0);
  const color = scoreColor(score);
  const radius = 80;
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
        <svg viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#1F1F24"
            strokeWidth="14"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="14"
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
        <div
          className="score-prediction-pill"
          style={{
            color: color,
            borderColor: `${color}35`,
            background: `${color}10`,
          }}
        >
          ● {String(data.prediction || "normal").replace("_", " ").toUpperCase()}
        </div>
        <p className="score-subtext">Algorithmic Distribution & Velocity Index</p>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";

function scoreColor(score) {
  if (score >= 70) return "#1D9E75";
  if (score >= 40) return "#EF9F27";
  return "#E24B4A";
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

  return (
    <section className="health-card">
      <div className="score-ring">
        <svg viewBox="0 0 220 220">
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="transparent"
            stroke="#303030"
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
        </div>
      </div>

      <p className="score-user">@{data.username}</p>
      <p className="score-prediction">
        {String(data.prediction || "").replace("_", " ")}
      </p>
    </section>
  );
}

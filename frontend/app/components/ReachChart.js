"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ReachChart({ data }) {
  const [range, setRange] = useState("ALL");
  const rawData = data?.reach_data || [];
  const isRoas = data?.metric_type === "roas";
  const alertLevel = data?.alert_level || "green";

  // Mature, non-neon editorial tones
  const chartColor = alertLevel === "red" ? "#B91C1C" : alertLevel === "yellow" ? "#D97706" : "#15803D";

  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    if (range === "30D") return rawData.slice(-30);
    if (range === "60D") return rawData.slice(-60);
    if (range === "90D") return rawData.slice(-90);
    return rawData;
  }, [rawData, range]);

  const anomalySet = useMemo(() => {
    return new Set((data?.anomalies || []).map((a) => a.date));
  }, [data?.anomalies]);

  return (
    <section className="chart-card">
      <div className="chart-header">
        <div className="chart-title-group">
          <h2>Daily Reach vs. Expected Baseline</h2>
          <p>Tracking daily observed performance against seasonality-adjusted baseline.</p>
        </div>

        <div className="range-pills">
          {["30D", "60D", "90D", "ALL"].map((tab) => (
            <button
              key={tab}
              onClick={() => setRange(tab)}
              className={`range-pill-btn ${range === tab ? "range-pill-btn-active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-legend">
        <div className="chart-legend-item">
          <span className="legend-swatch-solid" style={{ backgroundColor: chartColor }} />
          <span>Actual Reach</span>
        </div>
        <div className="chart-legend-item">
          <span className="legend-swatch-dash" />
          <span>Expected Baseline</span>
        </div>
        {data?.anomalies?.length > 0 && (
          <div className="chart-legend-item">
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#B91C1C",
                display: "inline-block",
              }}
            />
            <span style={{ color: "#B91C1C" }}>
              Decoupling Events ({data.anomalies.length} days)
            </span>
          </div>
        )}
      </div>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.12} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              minTickGap={32}
              stroke="transparent"
              tick={{ fill: "var(--text-dim)", fontSize: 12, fontFamily: "var(--font-mono)" }}
            />

            <YAxis
              stroke="transparent"
              tick={{ fill: "var(--text-dim)", fontSize: 12, fontFamily: "var(--font-mono)" }}
              tickFormatter={(v) => (isRoas ? `${v}x` : Number(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              domain={["auto", "auto"]}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                const isAnomaly = anomalySet.has(pt.date);
                const variance = pt.baseline > 0 ? (((pt.reach - pt.baseline) / pt.baseline) * 100).toFixed(1) : "0.0";

                return (
                  <div className="clean-tooltip mono-num">
                    <div className="tooltip-date">{formatDate(pt.date)}</div>
                    <div className="tooltip-line">
                      <span style={{ color: chartColor }}>Actual:</span>
                      <span style={{ color: "var(--text-title)", fontWeight: 600 }}>
                        {isRoas ? `${pt.reach}x` : Number(pt.reach).toLocaleString()}
                      </span>
                    </div>
                    <div className="tooltip-line">
                      <span style={{ color: "var(--text-muted)" }}>Expected:</span>
                      <span style={{ color: "var(--text-body)" }}>
                        {isRoas ? `${pt.baseline}x` : Number(pt.baseline).toLocaleString()}
                      </span>
                    </div>
                    <div className="tooltip-line" style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px solid var(--border-light)" }}>
                      <span style={{ color: "var(--text-dim)" }}>Variance:</span>
                      <span style={{ color: Number(variance) < 0 ? "#B91C1C" : "#15803D", fontWeight: 600 }}>
                        {Number(variance) > 0 ? "+" : ""}{variance}%
                      </span>
                    </div>
                    {isAnomaly && (
                      <div style={{ marginTop: "6px", fontSize: "11px", color: "#B91C1C", fontWeight: 600 }}>
                        ● Statistical Anomaly Flag
                      </div>
                    )}
                  </div>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey="baseline"
              stroke="var(--text-dim)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="transparent"
              isAnimationActive={false}
            />

            <Area
              type="monotone"
              dataKey="reach"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#actualFill)"
              isAnimationActive={true}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

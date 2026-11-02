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
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getTrajectoryColor(alertLevel) {
  if (alertLevel === "green") return "#10B981";
  if (alertLevel === "yellow") return "#F59E0B";
  return "#F43F5E";
}

export default function ReachChart({ data }) {
  const [range, setRange] = useState("ALL");
  const rawData = data?.reach_data || [];
  const color = getTrajectoryColor(data?.alert_level);
  const metricType = (data?.metric_type || "reach").toUpperCase();
  const isRoas = data?.metric_type === "roas";

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
    <section className="chart-radar-panel">
      <div className="chart-header-row">
        <div className="chart-title-block">
          <h2>Distribution Velocity Trajectory</h2>
          <p className="chart-subtitle-block">
            Observed daily {metricType} plotted against rolling seasonality-normalized baseline
          </p>
        </div>

        <div className="chart-controls-cluster">
          <div className="range-tab-group">
            {["30D", "60D", "90D", "ALL"].map((tab) => (
              <button
                key={tab}
                onClick={() => setRange(tab)}
                className={`range-tab-btn ${range === tab ? "range-tab-btn-active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-legend-row">
        <div className="legend-chip">
          <span className="legend-line-actual" style={{ backgroundColor: color }} />
          <span>Observed Run-Rate</span>
        </div>
        <div className="legend-chip">
          <span className="legend-line-baseline" />
          <span>Model Expected Baseline</span>
        </div>
        {data?.anomalies?.length > 0 && (
          <div className="legend-chip">
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#F43F5E",
                display: "inline-block",
              }}
            />
            <span style={{ color: "#F43F5E" }}>
              Decoupling Events ({data.anomalies.length})
            </span>
          </div>
        )}
      </div>

      <div className="chart-viewport-box">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="90%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6B7280" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#6B7280" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              minTickGap={36}
              stroke="transparent"
              tick={{ fill: "#6B7280", fontSize: 11, fontFamily: "var(--font-mono)" }}
            />

            <YAxis
              stroke="transparent"
              tick={{ fill: "#6B7280", fontSize: 11, fontFamily: "var(--font-mono)" }}
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
                  <div className="radar-custom-tooltip font-mono-nums">
                    <div className="tooltip-date-header">{formatDate(pt.date)}</div>
                    <div className="tooltip-row">
                      <span style={{ color: color }}>Observed:</span>
                      <span className="tooltip-val-bold">
                        {isRoas ? `${pt.reach}x` : Number(pt.reach).toLocaleString()}
                      </span>
                    </div>
                    <div className="tooltip-row">
                      <span style={{ color: "#9CA3AF" }}>Baseline:</span>
                      <span style={{ color: "#D1D5DB" }}>
                        {isRoas ? `${pt.baseline}x` : Number(pt.baseline).toLocaleString()}
                      </span>
                    </div>
                    <div className="tooltip-row" style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ color: "#6B7280" }}>Model Drift:</span>
                      <span style={{ color: Number(variance) < 0 ? "#F43F5E" : "#10B981", fontWeight: 600 }}>
                        {Number(variance) > 0 ? "+" : ""}{variance}%
                      </span>
                    </div>
                    {isAnomaly && (
                      <div style={{ marginTop: "6px", fontSize: "10.5px", color: "#F43F5E", fontWeight: 600 }}>
                        ● Feed Decoupling Outlier
                      </div>
                    )}
                  </div>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey="baseline"
              stroke="#6B7280"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#baselineGrad)"
              isAnimationActive={true}
              animationDuration={800}
            />

            <Area
              type="monotone"
              dataKey="reach"
              stroke={color}
              strokeWidth={2.5}
              fill="url(#velocityGrad)"
              isAnimationActive={true}
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

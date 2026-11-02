"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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

function getMetricColor(alertLevel) {
  if (alertLevel === "green") return "#10B981"; // Emerald
  if (alertLevel === "yellow") return "#F59E0B"; // Amber
  return "#F43F5E"; // Coral
}

export default function ReachChart({ data }) {
  const [range, setRange] = useState("ALL");
  const rawData = data.reach_data || [];
  const color = getMetricColor(data.alert_level);
  const metricType = (data.metric_type || "reach").toUpperCase();
  const isRoas = data.metric_type === "roas";

  // Filter series based on selected window
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    if (range === "30D") return rawData.slice(-30);
    if (range === "60D") return rawData.slice(-60);
    if (range === "90D") return rawData.slice(-90);
    return rawData;
  }, [rawData, range]);

  const anomalyDates = useMemo(() => {
    return new Set((data.anomalies || []).map((a) => a.date));
  }, [data.anomalies]);

  return (
    <section className="chart-card">
      <div className="chart-header">
        <div className="chart-title-area">
          <h2>Distribution Velocity Trajectory</h2>
          <p className="chart-subhead">
            Tracking observed {metricType} against seasonality-normalized baseline expectations
          </p>
        </div>

        <div className="chart-controls">
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-indicator" style={{ backgroundColor: color }} />
              <span>Observed Run-Rate</span>
            </div>
            <div className="legend-item">
              <span
                className="legend-indicator"
                style={{
                  backgroundColor: "#71717A",
                  borderTop: "1px dashed #A1A1AA",
                }}
              />
              <span>Baseline Model</span>
            </div>
            {data.anomalies?.length > 0 && (
              <div className="legend-item">
                <span className="legend-indicator" style={{ backgroundColor: "#F43F5E" }} />
                <span>Outlier Cluster ({data.anomalies.length})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 14, left: -6, bottom: 0 }}>
            <defs>
              <linearGradient id="presentationFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.22} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              minTickGap={32}
              tick={{ fill: "#71717A", fontSize: 11.5, fontFamily: "var(--font-sans)" }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              tickLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
            />
            <YAxis
              tick={{ fill: "#71717A", fontSize: 11.5, fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              tickLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              width={56}
              tickFormatter={(v) =>
                isRoas
                  ? `${v}x`
                  : Number(v) > 999
                  ? `${(v / 1000).toFixed(0)}k`
                  : v
              }
            />

            <Tooltip
              cursor={{ stroke: "rgba(255, 255, 255, 0.18)", strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                const isAnomaly = anomalyDates.has(pt.date) || pt.is_anomaly;
                const actual = isRoas ? `${pt.reach}x` : Number(pt.reach).toLocaleString();
                const baseline = pt.baseline
                  ? isRoas
                    ? `${pt.baseline}x`
                    : Number(pt.baseline).toLocaleString()
                  : null;
                const delta = pt.baseline
                  ? (((pt.reach - pt.baseline) / pt.baseline) * 100).toFixed(1)
                  : null;

                return (
                  <div
                    style={{
                      background: "#161920",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.75)",
                      fontSize: "12.5px",
                      minWidth: "200px",
                    }}
                  >
                    <div style={{ color: "#A1A1AA", marginBottom: "8px", fontSize: "11.5px" }}>
                      {formatDate(pt.date)} ({pt.date})
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ color: "#71717A" }}>Observed:</span>
                      <span style={{ color: "#F4F4F6", fontWeight: 600 }} className="tabular-nums">{actual}</span>
                    </div>
                    {baseline && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ color: "#71717A" }}>Model Baseline:</span>
                        <span style={{ color: "#A1A1AA" }} className="tabular-nums">{baseline}</span>
                      </div>
                    )}
                    {delta && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#71717A" }}>Variance Delta:</span>
                        <span
                          className="tabular-nums"
                          style={{
                            color: Number(delta) < 0 ? "#F43F5E" : "#10B981",
                            fontWeight: 600,
                          }}
                        >
                          {Number(delta) > 0 ? "+" : ""}{delta}%
                        </span>
                      </div>
                    )}
                    {isAnomaly && (
                      <div
                        style={{
                          marginTop: "8px",
                          paddingTop: "8px",
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                          color: "#F43F5E",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        ● Statistical Anomaly Outlier
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Observed trajectory curve */}
            <Area
              type="monotone"
              dataKey="reach"
              stroke={color}
              strokeWidth={2.5}
              fill="url(#presentationFill)"
              isAnimationActive={false}
            />

            {/* Seasonality-adjusted baseline */}
            {chartData[0]?.baseline && (
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="#71717A"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

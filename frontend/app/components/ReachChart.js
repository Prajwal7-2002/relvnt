"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Line,
  ReferenceLine,
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
  return "#EF4444"; // Crimson
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
          <h2>{metricType} Performance Trajectory &amp; Baseline</h2>
          <p className="chart-subhead">
            Tracking observed trajectory vs. seasonality-normalized median expectation
          </p>
        </div>

        <div className="chart-controls">
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: color }} />
              <span>Observed</span>
            </div>
            <div className="legend-item">
              <span
                className="legend-dot"
                style={{
                  backgroundColor: "#64748B",
                  borderStyle: "dashed",
                }}
              />
              <span>Baseline</span>
            </div>
            {data.anomalies?.length > 0 && (
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: "#EF4444" }} />
                <span>Outlier ({data.anomalies.length})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              minTickGap={32}
              tick={{ fill: "#64748B", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              tickLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
            />
            <YAxis
              tick={{ fill: "#64748B", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              tickLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              width={54}
              tickFormatter={(v) =>
                isRoas
                  ? `${v}x`
                  : Number(v) > 999
                  ? `${(v / 1000).toFixed(0)}k`
                  : v
              }
            />

            <Tooltip
              cursor={{ stroke: "rgba(255, 255, 255, 0.15)", strokeDasharray: "3 3" }}
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
                      background: "#0D0F13",
                      border: "1px solid rgba(255, 255, 255, 0.14)",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.8)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      minWidth: "180px",
                    }}
                  >
                    <div style={{ color: "#94A3B8", marginBottom: "6px", fontSize: "11px" }}>
                      {formatDate(pt.date)} ({pt.date})
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: "#64748B" }}>Observed:</span>
                      <span style={{ color: "#F1F5F9", fontWeight: 600 }}>{actual}</span>
                    </div>
                    {baseline && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#64748B" }}>Baseline:</span>
                        <span style={{ color: "#94A3B8" }}>{baseline}</span>
                      </div>
                    )}
                    {delta && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#64748B" }}>Divergence:</span>
                        <span style={{ color: Number(delta) < 0 ? "#EF4444" : "#10B981" }}>
                          {Number(delta) > 0 ? "+" : ""}{delta}%
                        </span>
                      </div>
                    )}
                    {isAnomaly && (
                      <div
                        style={{
                          marginTop: "6px",
                          paddingTop: "6px",
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                          color: "#EF4444",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        [ANOMALY_OUTLIER_DETECTED]
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Observed trajectory area */}
            <Area
              type="monotone"
              dataKey="reach"
              stroke={color}
              strokeWidth={2}
              fill="url(#metricFill)"
              isAnimationActive={false}
            />

            {/* Baseline comparison curve */}
            {chartData[0]?.baseline && (
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="#64748B"
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

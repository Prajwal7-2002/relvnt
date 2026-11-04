"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMetric } from "../../lib/health";

const RANGES = [
  { id: "30", label: "30d" },
  { id: "60", label: "60d" },
  { id: "90", label: "90d" },
  { id: "all", label: "All" },
];

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ReachChart({ data }) {
  const [range, setRange] = useState("all");
  const metricType = data?.metric_type;
  const isRoas = metricType === "roas";
  const perPost = data?.data_source === "post_export";
  const metricLabel = isRoas ? "ROAS" : "reach";

  const chartData = useMemo(() => {
    const raw = data?.reach_data || [];
    return range === "all" ? raw : raw.slice(-Number(range));
  }, [data?.reach_data, range]);

  const flagged = useMemo(() => new Set((data?.anomalies || []).map((a) => a.date)), [data?.anomalies]);
  const flaggedInView = chartData.filter((pt) => flagged.has(pt.date)).length;

  // Mark flagged days directly on the line
  const renderDot = ({ cx, cy, payload, index }) =>
    flagged.has(payload.date) ? (
      <circle key={index} cx={cx} cy={cy} r={3} fill="var(--status-drift)" stroke="var(--bg-surface)" strokeWidth={1.5} />
    ) : (
      <g key={index} />
    );

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="section-title">{perPost ? "Reach per post" : `Daily ${metricLabel}`}</h2>
          <p className="section-subtitle">
            {perPost
              ? "Each point is a day you posted (average if there were several posts), compared with what is usual."
              : "Compared with what is usual for each day of the week."}
          </p>
        </div>
        <div className="segmented" role="tablist" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={range === r.id}
              onClick={() => setRange(r.id)}
              className={`segmented-btn ${range === r.id ? "segmented-btn-active" : ""}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="legend">
        <span className="legend-item">
          <span className="legend-line" />
          Actual
        </span>
        <span className="legend-item">
          <span className="legend-line legend-line-dashed" />
          Usual
        </span>
        {flaggedInView > 0 && (
          <span className="legend-item">
            <span className="legend-dot" />
            Flagged days ({flaggedInView})
          </span>
        )}
      </div>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-line)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--chart-line)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              minTickGap={40}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              width={52}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              tickFormatter={(v) => (isRoas ? `${v}x` : v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
              domain={["auto", "auto"]}
            />

            <Tooltip
              cursor={{ stroke: "var(--border-medium)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const pt = payload[0].payload;
                const diff = pt.baseline > 0 ? ((pt.reach - pt.baseline) / pt.baseline) * 100 : 0;
                return (
                  <div className="chart-tooltip">
                    <div className="chart-tooltip-date">{formatDate(pt.date)}</div>
                    <div className="chart-tooltip-row">
                      <span>Actual</span>
                      <strong>{formatMetric(pt.reach, metricType)}</strong>
                    </div>
                    <div className="chart-tooltip-row">
                      <span>Usual</span>
                      <span>{formatMetric(pt.baseline, metricType)}</span>
                    </div>
                    <div className="chart-tooltip-row">
                      <span>Difference</span>
                      <strong className={diff < 0 ? "text-down" : "text-up"}>
                        {diff > 0 ? "+" : diff < 0 ? "−" : ""}
                        {Math.abs(diff).toFixed(1)}%
                      </strong>
                    </div>
                    {flagged.has(pt.date) && <div className="chart-tooltip-flag">Flagged: well below usual</div>}
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
              stroke="var(--chart-line)"
              strokeWidth={2}
              fill="url(#actualFill)"
              dot={renderDot}
              activeDot={{ r: 4, fill: "var(--chart-line)", stroke: "var(--bg-surface)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

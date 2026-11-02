"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function alertColor(alertLevel) {
  if (alertLevel === "green") return "#10B981";
  if (alertLevel === "yellow") return "#F59E0B";
  return "#EF4444";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}

export default function ReachChart({ data }) {
  const chartData = data.reach_data || [];
  const color = alertColor(data.alert_level);
  const metricName = (data.metric_type || "reach").toUpperCase();
  const anomalyDates = new Set((data.anomalies || []).map((a) => a.date));

  return (
    <section className="chart-card">
      <div className="chart-header">
        <div>
          <h2>Performance Timeline — {metricName}</h2>
          <p className="chart-subhead">
            Tracking 90-day momentum & mathematical distribution anomalies
          </p>
        </div>
        <div className="chart-header-badges">
          <span className={`status-tag status-${data.alert_level}`}>
            ● {String(data.prediction || "normal").replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      <div className="chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 18, left: 4, bottom: 4 }}>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              minTickGap={28}
              tick={{ fill: "#A3A3A3", fontSize: 12 }}
              axisLine={{ stroke: "#303030" }}
              tickLine={{ stroke: "#303030" }}
            />
            <YAxis
              tick={{ fill: "#A3A3A3", fontSize: 12 }}
              axisLine={{ stroke: "#303030" }}
              tickLine={{ stroke: "#303030" }}
              width={58}
              tickFormatter={(v) =>
                data.metric_type === "roas" ? `${v}x` : Number(v) > 999 ? `${(v / 1000).toFixed(0)}k` : v
              }
            />
            <Tooltip
              cursor={{ stroke: "#404040" }}
              contentStyle={{
                background: "#111111",
                border: "1px solid #303030",
                borderRadius: "10px",
                color: "#FFFFFF"
              }}
              labelFormatter={formatDate}
              formatter={(value, name, item) => {
                const isAnomaly = anomalyDates.has(item.payload.date);
                const formatted =
                  data.metric_type === "roas"
                    ? `${Number(value).toFixed(2)}x`
                    : Number(value).toLocaleString();
                return [
                  `${formatted} ${isAnomaly ? "⚠️ (Anomaly Outlier)" : ""}`,
                  metricName
                ];
              }}
            />
            <Line
              type="monotone"
              dataKey="reach"
              stroke={color}
              strokeWidth={3}
              dot={(props) => {
                const isAnomaly = anomalyDates.has(props.payload.date);
                if (isAnomaly) {
                  return (
                    <circle
                      key={props.payload.date}
                      cx={props.cx}
                      cy={props.cy}
                      r={5}
                      fill="#EF4444"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  );
                }
                return (
                  <circle
                    key={props.payload.date}
                    cx={props.cx}
                    cy={props.cy}
                    r={2}
                    fill={color}
                  />
                );
              }}
              activeDot={{ r: 6, fill: color, stroke: "#0F0F0F", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

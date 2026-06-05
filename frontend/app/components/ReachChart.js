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
  if (alertLevel === "green") return "#1D9E75";
  if (alertLevel === "yellow") return "#EF9F27";
  return "#E24B4A";
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

  return (
    <section className="chart-card">
      <div className="chart-header">
        <h2>Reach — Last 90 Days</h2>
        <span>{data.alert_level}</span>
      </div>

      <div className="chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 18, left: 4, bottom: 4 }}>
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
              formatter={(value) => [Number(value).toLocaleString(), "Reach"]}
            />
            <Line
              type="monotone"
              dataKey="reach"
              stroke={color}
              strokeWidth={3}
              dot={{ r: 2, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, stroke: "#0F0F0F", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

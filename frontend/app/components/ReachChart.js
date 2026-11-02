"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function alertColor(alertLevel) {
  if (alertLevel === "green") return "#10B981";
  if (alertLevel === "yellow") return "#F59E0B";
  return "#F43F5E";
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
            90-Day Velocity Tracking with Outlier Anomaly Detection
          </p>
        </div>
        <div>
          <span className={`status-tag status-${data.alert_level}`}>
            ● {String(data.prediction || "normal").replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      <div className="chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 14, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              minTickGap={26}
              tick={{ fill: "#71717A", fontSize: 11.5 }}
              axisLine={{ stroke: "#1F1F24" }}
              tickLine={{ stroke: "#1F1F24" }}
            />
            <YAxis
              tick={{ fill: "#71717A", fontSize: 11.5 }}
              axisLine={{ stroke: "#1F1F24" }}
              tickLine={{ stroke: "#1F1F24" }}
              width={52}
              tickFormatter={(v) =>
                data.metric_type === "roas"
                  ? `${v}x`
                  : Number(v) > 999
                  ? `${(v / 1000).toFixed(0)}k`
                  : v
              }
            />
            <Tooltip
              cursor={{ stroke: "#3F3F46", strokeDasharray: "3 3" }}
              contentStyle={{
                background: "#121215",
                border: "1px solid #27272A",
                borderRadius: "8px",
                color: "#FAFAFA",
                fontSize: "12.5px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
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
            <Area
              type="monotone"
              dataKey="reach"
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#metricGrad)"
              dot={(props) => {
                const isAnomaly = anomalyDates.has(props.payload.date);
                if (isAnomaly) {
                  return (
                    <circle
                      key={props.payload.date}
                      cx={props.cx}
                      cy={props.cy}
                      r={4.5}
                      fill="#F43F5E"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                  );
                }
                return null;
              }}
              activeDot={{ r: 5, fill: color, stroke: "#09090B", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { displayName, formatMetric, healthLevel, platformLabel } from "../../lib/health";

// One-page A4 report, shown only when printing ("Export report" -> Save as PDF).
// Uses a fixed-size chart because a hidden container can't be measured.

const SOURCE_LABEL = {
  post_export: "Per-post export",
  csv_upload: "CSV upload",
  google_sheets_live: "Google Sheet",
  instagram_live_api: "Instagram",
};

function formatDay(value, withYear = false) {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

function headline(level, changePct) {
  const pct = Math.abs(changePct).toFixed(0);
  if (level.key === "healthy") return changePct >= 1 ? `Reach is ${pct}% above usual` : "Reach is in its usual range";
  return `Reach is ${pct}% below usual`;
}

export default function ClientReport({ data, agency }) {
  if (!data) return null;

  const score = Math.max(0, Math.min(100, Number(data.health_score || 0)));
  const level = healthLevel(score);
  const metrics = data.metrics_summary || {};
  const metricType = data.metric_type;
  const changePct = Number(metrics.change_pct || 0);
  const series = data.reach_data || [];
  const insights = data.post_insights;
  const findings = (insights?.findings || []).slice(0, 4);
  const steps = (data.protocol_phases || []).slice(0, 3);
  const periodStart = insights?.period_start || series[0]?.date;
  const periodEnd = insights?.period_end || series[series.length - 1]?.date;

  return (
    <article className="client-report" aria-hidden="true">
      <header className="report-header">
        <div className="report-brand">
          <span className="report-monogram">{agency.monogram}</span>
          <div>
            <div className="report-agency">{agency.name}</div>
            {agency.tagline && <div className="report-tagline">{agency.tagline}</div>}
          </div>
        </div>
        <div className="report-meta">
          <div className="report-doc-title">Performance check-up</div>
          <div>{formatDay(new Date(), true)}</div>
        </div>
      </header>

      <section className="report-client">
        <h1>{displayName(data.account_name)}</h1>
        <p>
          {platformLabel(data.platform)} · {formatDay(periodStart)} – {formatDay(periodEnd, true)} ·{" "}
          {SOURCE_LABEL[data.data_source] || "Sample data"}
          {insights ? ` · ${insights.post_count} posts` : ""}
        </p>
      </section>

      <section className="report-summary">
        <div>
          <span className={`report-status report-status-${level.key}`}>{level.label}</span>
          <h2>{headline(level, changePct)}</h2>
          {data.diagnosis && <p>{data.diagnosis}</p>}
        </div>
        <div className="report-score">
          <span>{score}</span>
          <small>Health score / 100</small>
        </div>
      </section>

      <dl className="report-stats">
        <div>
          <dt>Average, {metrics.recent_window_label || "last 7 days"}</dt>
          <dd>{formatMetric(metrics.recent_avg ?? metrics.current_value, metricType)}</dd>
        </div>
        <div>
          <dt>Usual level</dt>
          <dd>{formatMetric(metrics.baseline_avg, metricType)}</dd>
        </div>
        <div>
          <dt>Change</dt>
          <dd className={changePct < 0 ? "report-down" : "report-up"}>
            {changePct > 0 ? "+" : changePct < 0 ? "−" : ""}
            {Math.abs(changePct).toFixed(1)}%
          </dd>
        </div>
      </dl>

      {series.length > 1 && (
        <section className="report-chart">
          <h3>{data.data_source === "post_export" ? "Reach per post" : "Daily reach"}: actual vs usual</h3>
          <AreaChart width={680} height={150} data={series} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid stroke="#E3DED1" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(v) => formatDay(v)} minTickGap={48} axisLine={false} tickLine={false} tick={{ fill: "#6F7770", fontSize: 10 }} />
            <YAxis width={44} axisLine={false} tickLine={false} tick={{ fill: "#6F7770", fontSize: 10 }} tickFormatter={(v) => (metricType === "roas" ? `${v}x` : v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
            <Area type="monotone" dataKey="baseline" stroke="#A3A79F" strokeDasharray="4 4" strokeWidth={1.2} fill="transparent" isAnimationActive={false} />
            <Area type="monotone" dataKey="reach" stroke="#1F4A3A" strokeWidth={1.6} fill="#1F4A3A" fillOpacity={0.06} isAnimationActive={false} />
          </AreaChart>
        </section>
      )}

      <div className="report-columns">
        {findings.length > 0 && (
          <section>
            <h3>What we found</h3>
            <ul className="report-findings">
              {findings.map((f) => (
                <li key={f.id}>
                  <strong>{f.title}.</strong> {f.detail}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3>What to do this week</h3>
          <ol className="report-steps">
            {steps.map((s, i) => (
              <li key={i}>
                <strong>{s.title}.</strong> {s.action}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="report-footer">
        <div>
          Prepared by <strong>{agency.auditorName}</strong>
          {agency.role ? `, ${agency.role}` : ""} · {agency.name}
          {agency.contact ? ` · ${agency.contact}` : ""}
        </div>
        <div className="report-method">
          How this works: each day is compared with what is usual for that day of the week, based on the account&apos;s own
          history. One-off spikes are capped so they don&apos;t inflate &quot;usual&quot;. Findings show what changed at the same time;
          they are not proof of cause.
        </div>
      </footer>
    </article>
  );
}

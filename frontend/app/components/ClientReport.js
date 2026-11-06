"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useReportDetails } from "../../lib/branding";
import { displayName, formatMetric, healthLevel, platformLabel } from "../../lib/health";
import { defaultReportContent } from "../../lib/report";
import ComparisonCards from "./ComparisonCards";
import PostingCalendar from "./PostingCalendar";

// One-page A4 report, shown only when printing ("Export report" -> Save as PDF).
// Uses a fixed-size chart because a hidden container can't be measured.

const SOURCE_STATEMENT = {
  post_export: "Per-post export from Meta Business Suite, supplied by the client",
  csv_upload: "CSV export supplied by the client",
  google_sheets_live: "Google Sheet supplied by the client",
  instagram_live_api: "Instagram Insights (connected account)",
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

// Stable reference number for a client + period, e.g. "CB-261104-7Q3"
export function reportReference(monogram, account, periodEnd, issued = new Date()) {
  const key = `${account}|${periodEnd}`;
  let hash = 5381;
  for (let i = 0; i < key.length; i++) hash = ((hash << 5) + hash + key.charCodeAt(i)) >>> 0;
  const yymmdd = issued.toISOString().slice(2, 10).replace(/-/g, "");
  return `${monogram}-${yymmdd}-${hash.toString(36).slice(-3).toUpperCase()}`;
}

// `screen` shows the report on the page too (public sample report), not only when printing
export default function ClientReport({ data, agency, edits, screen = false }) {
  const details = useReportDetails();
  if (!data) return null;

  const score = Math.max(0, Math.min(100, Number(data.health_score || 0)));
  const level = healthLevel(score);
  const metrics = data.metrics_summary || {};
  const metricType = data.metric_type;
  const changePct = Number(metrics.change_pct || 0);
  const series = data.reach_data || [];
  const insights = data.post_insights;
  // The edited version from "Review report", or the generated content
  const content = edits || defaultReportContent(data);
  const findings = content.findings.filter((f) => f.title.trim() || f.detail.trim());
  const steps = content.steps.filter((s) => s.title.trim() || s.action.trim());
  const periodStart = insights?.period_start || series[0]?.date;
  const periodEnd = insights?.period_end || series[series.length - 1]?.date;
  const client = displayName(data.account_name);
  const issued = new Date();
  const contactItems = [details.address, details.phone, agency.contact, details.website, details.gstin && `GSTIN ${details.gstin}`].filter(Boolean);
  const sourceStatement = SOURCE_STATEMENT[data.data_source] || "Sample dataset (demonstration)";

  return (
    <article className={`client-report ${screen ? "client-report-screen" : ""}`} aria-hidden={screen ? undefined : "true"}>
      <header className="report-letterhead">
        <div className="report-brand">
          {details.logo ? (
            <img className="report-logo" src={details.logo} alt="" />
          ) : (
            <span className="report-monogram">{agency.monogram}</span>
          )}
          <div>
            <div className="report-agency">{agency.name}</div>
            {agency.tagline && <div className="report-tagline">{agency.tagline}</div>}
          </div>
        </div>
        <div className="report-doc">
          <div className="report-doc-title">Performance check-up</div>
          <div>Ref. {reportReference(agency.monogram, data.account_name, periodEnd, issued)}</div>
          <div>{formatDay(issued, true)}</div>
        </div>
      </header>
      {contactItems.length > 0 && <div className="report-contact">{contactItems.join("  ·  ")}</div>}

      <table className="report-facts">
        <tbody>
          <tr>
            <th>Prepared for</th>
            <td>{client}</td>
            <th>Period</th>
            <td>
              {formatDay(periodStart)} – {formatDay(periodEnd, true)}
            </td>
          </tr>
          <tr>
            <th>Platform</th>
            <td>{platformLabel(data.platform)}</td>
            <th>Data</th>
            <td>
              {sourceStatement}
              {insights ? ` (${insights.post_count} posts)` : ""}
            </td>
          </tr>
        </tbody>
      </table>

      <section className="report-section">
        <h2 className="report-section-title">
          <span>1</span> Summary
        </h2>
        <div className="report-summary">
          <div>
            <span className={`report-status report-status-${level.key}`}>{level.label}</span>
            <h3>{headline(level, changePct)}</h3>
            {content.summary && <p>{content.summary}</p>}
          </div>
          <div className="report-score">
            <span>{score}</span>
            <small>Health score out of 100</small>
          </div>
        </div>

        <table className="report-numbers">
          <tbody>
            <tr>
              <th>Average, {metrics.recent_window_label || "last 7 days"}</th>
              <th>Usual level</th>
              <th>Change</th>
            </tr>
            <tr>
              <td>{formatMetric(metrics.recent_avg ?? metrics.current_value, metricType)}</td>
              <td>{formatMetric(metrics.baseline_avg, metricType)}</td>
              <td className={changePct < 0 ? "report-down" : "report-up"}>
                {changePct > 0 ? "+" : changePct < 0 ? "−" : ""}
                {Math.abs(changePct).toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>

        {series.length > 1 && (
          <figure className="report-chart">
            <AreaChart width={680} height={100} data={series} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="#E3DED1" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v) => formatDay(v)} minTickGap={48} axisLine={false} tickLine={false} tick={{ fill: "#6F7770", fontSize: 9 }} />
              <YAxis width={44} axisLine={false} tickLine={false} tick={{ fill: "#6F7770", fontSize: 9 }} tickFormatter={(v) => (metricType === "roas" ? `${v}x` : v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
              <Area type="monotone" dataKey="baseline" stroke="#A3A79F" strokeDasharray="4 4" strokeWidth={1.2} fill="transparent" isAnimationActive={false} />
              <Area type="monotone" dataKey="reach" stroke="#1F4A3A" strokeWidth={1.6} fill="#1F4A3A" fillOpacity={0.06} isAnimationActive={false} />
            </AreaChart>
            <figcaption>
              {data.data_source === "post_export" ? "Reach per post" : "Daily reach"}: actual (solid) vs usual for that day of the
              week (dashed).
            </figcaption>
          </figure>
        )}

        {insights && (insights.comparison || insights.calendar?.length > 0) && (
          <div className="report-visuals">
            {insights.comparison && <ComparisonCards comparison={insights.comparison} compact />}
            {insights.calendar?.length > 0 && (
              <div>
                <div className="report-visual-title">Posting calendar</div>
                <PostingCalendar calendar={insights.calendar} compact />
              </div>
            )}
          </div>
        )}
      </section>

      <div className="report-columns">
        {findings.length > 0 && (
          <section className="report-section">
            <h2 className="report-section-title">
              <span>2</span> What we found
            </h2>
            <ul className="report-findings">
              {findings.map((f, i) => (
                <li key={i}>
                  {f.title && <strong>{f.title.replace(/\.$/, "")}.</strong>} {f.detail}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="report-section">
          <h2 className="report-section-title">
            <span>{findings.length > 0 ? 3 : 2}</span> Recommended actions
          </h2>
          <ol className="report-steps">
            {steps.map((s, i) => (
              <li key={i}>
                {s.title && <strong>{s.title.replace(/\.$/, "")}.</strong>} {s.action}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {content.note?.trim() && (
        <section className="report-note">
          <h3>Note from {agency.auditorName}</h3>
          <p>{content.note}</p>
        </section>
      )}

      <div className="report-signoff">
        <div className="report-signature">
          <div className="report-signature-line" />
          <strong>{agency.auditorName}</strong>
          {agency.role && <span>{agency.role}</span>}
          <span>
            {agency.name} · {formatDay(issued, true)}
          </span>
        </div>
      </div>

      <footer className="report-footer">
        <div className="report-footer-row">
          <span>
            Confidential. Prepared for {client} by {agency.name}.
          </span>
          <span>Page 1 of 1</span>
        </div>
        <div className="report-method">
          Method: each day is compared with what is usual for that day of the week, based on the account&apos;s own history.
          One-off spikes are capped so they don&apos;t inflate &quot;usual&quot;. Findings describe what changed at the same time;
          they are not proof of cause.
        </div>
      </footer>
    </article>
  );
}

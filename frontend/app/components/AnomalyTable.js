"use client";

import { useMemo, useState } from "react";
import { formatMetric } from "../../lib/health";

const PREVIEW_ROWS = 10;

function formatDay(value) {
  try {
    return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AnomalyTable({ data }) {
  const [showAll, setShowAll] = useState(false);
  const metricType = data?.metric_type;

  const rows = useMemo(() => {
    const usualByDate = {};
    (data?.reach_data || []).forEach((pt) => {
      if (pt.date) usualByDate[pt.date] = pt.baseline;
    });
    return (data?.anomalies || [])
      .map((a) => {
        const usual = usualByDate[a.date] ?? data?.metrics_summary?.baseline_avg ?? a.value;
        const diffPct = usual > 0 ? ((a.value - usual) / usual) * 100 : 0;
        return { date: a.date, actual: a.value, usual, diffPct };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data]);

  const visible = showAll ? rows : rows.slice(0, PREVIEW_ROWS);

  return (
    <section className="panel panel-flush">
      <div className="panel-header panel-header-padded">
        <div>
          <h2 className="section-title">Flagged days</h2>
          <p className="section-subtitle">Days where performance fell well below what is usual.</p>
        </div>
        <span className="panel-count">
          {rows.length} {rows.length === 1 ? "day" : "days"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">Nothing flagged</p>
          <p className="empty-state-text">No days fell well below usual in this period.</p>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Actual</th>
                  <th className="num col-optional">Usual</th>
                  <th className="num">Difference</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.date}>
                    <td>
                      <span className={`health-pill health-pill-${row.diffPct <= -40 ? "critical" : "watch"}`}>
                        {formatDay(row.date)}
                      </span>
                    </td>
                    <td className="num">{formatMetric(row.actual, metricType)}</td>
                    <td className="num text-muted col-optional">{formatMetric(row.usual, metricType)}</td>
                    <td className={`num ${row.diffPct < 0 ? "text-down" : "text-up"}`}>
                      {row.diffPct > 0 ? "+" : row.diffPct < 0 ? "−" : ""}
                      {Math.abs(row.diffPct).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > PREVIEW_ROWS && (
            <div className="panel-footer">
              <button className="link-button" onClick={() => setShowAll(!showAll)}>
                {showAll ? "Show fewer" : `Show all ${rows.length} days`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

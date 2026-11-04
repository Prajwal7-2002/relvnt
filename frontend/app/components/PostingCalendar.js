"use client";

import { useMemo } from "react";
import { formatMetric } from "../../lib/health";

const WEEKDAYS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

// "2026-08-04" as a local date (new Date("2026-08-04") is UTC and can shift the day)
const localDate = (iso) => new Date(`${iso}T00:00:00`);

function fmt(date, opts) {
  return new Intl.DateTimeFormat("en-IN", opts).format(date);
}

// Day-by-day grid (weeks as columns, Mon-Sun as rows). Shade = reach of that day's posts
// relative to the account's own posting days; empty = no post.
export default function PostingCalendar({ calendar, compact = false }) {
  const { weeks, months, thresholds } = useMemo(() => {
    if (!calendar?.length) return { weeks: [], months: [], thresholds: [] };

    const reaches = calendar.filter((d) => d.posts > 0).map((d) => d.reach).sort((a, b) => a - b);
    const q = (p) => reaches[Math.min(reaches.length - 1, Math.floor(p * reaches.length))];
    const cuts = [q(0.25), q(0.5), q(0.75)];

    const first = localDate(calendar[0].date);
    const lead = (first.getDay() + 6) % 7; // Monday = 0
    const cells = [...Array(lead).fill(null), ...calendar];
    const cols = [];
    for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));

    const labels = [];
    cols.forEach((col, idx) => {
      const day = col.find(Boolean);
      if (!day) return;
      const month = fmt(localDate(day.date), { month: "short" });
      if (!labels.length || labels[labels.length - 1].month !== month) labels.push({ idx, month });
    });
    return { weeks: cols, months: labels, thresholds: cuts };
  }, [calendar]);

  if (!weeks.length) return null;

  const level = (d) => {
    if (!d || d.posts === 0) return 0;
    if (d.reach <= thresholds[0]) return 1;
    if (d.reach <= thresholds[1]) return 2;
    if (d.reach <= thresholds[2]) return 3;
    return 4;
  };

  return (
    <div className={`calendar ${compact ? "calendar-compact" : ""}`}>
      <div className="calendar-months" style={{ gridTemplateColumns: `repeat(${weeks.length}, var(--cal-size))` }}>
        {months.map((m) => (
          <span key={`${m.month}-${m.idx}`} style={{ gridColumnStart: m.idx + 1 }}>
            {m.month}
          </span>
        ))}
      </div>
      <div className="calendar-body">
        <div className="calendar-weekdays">
          {WEEKDAYS.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div className="calendar-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, var(--cal-size))` }}>
          {weeks.map((col, ci) =>
            Array.from({ length: 7 }).map((_, ri) => {
              const d = col[ri];
              if (!d) return <span key={`${ci}-${ri}`} className="cal-cell cal-blank" style={{ gridColumn: ci + 1, gridRow: ri + 1 }} />;
              const label = `${fmt(localDate(d.date), { weekday: "short", day: "numeric", month: "short" })}: ${
                d.posts ? `${d.posts} ${d.posts === 1 ? "post" : "posts"}, reach ${formatMetric(d.reach)}` : "no post"
              }`;
              return (
                <span
                  key={d.date}
                  className={`cal-cell cal-l${level(d)}`}
                  style={{ gridColumn: ci + 1, gridRow: ri + 1 }}
                  title={label}
                  aria-label={label}
                />
              );
            })
          )}
        </div>
      </div>
      <div className="calendar-legend">
        <span className="cal-cell cal-l0" /> No post
        <span className="calendar-legend-gap" />
        Lower reach <span className="cal-cell cal-l1" /> <span className="cal-cell cal-l2" /> <span className="cal-cell cal-l3" />{" "}
        <span className="cal-cell cal-l4" /> Higher reach
      </div>
    </div>
  );
}

"use client";

const TONE_LEVEL = { negative: "critical", positive: "healthy", neutral: "watch" };

export function WordingNote({ findings }) {
  if (!findings?.some((f) => f.wording === "ai")) return null;
  return <p className="wording-note">Worded by AI. Every number was checked against the data.</p>;
}

// Findings from the daily numbers alone (no per-post export uploaded)
export default function DailyFindings({ findings }) {
  if (!findings?.length) return null;
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="section-title">What the daily numbers show</h2>
          <p className="section-subtitle">
            Upload a per-post export from Business Suite to see which formats, posting days and posts made the difference.
          </p>
        </div>
      </div>
      <ul className="findings">
        {findings.map((f) => (
          <li key={f.id} className="finding">
            <span className={`health-pill health-pill-${TONE_LEVEL[f.tone] || "watch"} finding-title`}>{f.title}</span>
            <p className="finding-detail">{f.detail}</p>
            {f.action && <p className="finding-action">{f.action}</p>}
          </li>
        ))}
      </ul>
      <WordingNote findings={findings} />
    </section>
  );
}

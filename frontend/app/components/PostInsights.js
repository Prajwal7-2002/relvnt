"use client";

import { formatMetric } from "../../lib/health";

const TONE_LEVEL = { negative: "critical", positive: "healthy", neutral: "watch" };
const FORMAT_LABEL = { Reel: "Reels", Carousel: "Carousels", Photo: "Photos", Video: "Videos", Other: "Other" };

function formatDay(value) {
  try {
    return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function PostList({ title, posts }) {
  if (!posts?.length) return null;
  return (
    <div className="post-list">
      <h3 className="post-list-title">{title}</h3>
      <ul>
        {posts.map((p, i) => (
          <li key={`${p.date}-${i}`} className="post-list-item">
            <div className="post-list-main">
              <span className="post-list-caption">{p.caption || "(no caption)"}</span>
              <span className="post-list-meta">
                {p.type} · {formatDay(p.date)}
                {p.permalink && (
                  <>
                    {" · "}
                    <a href={p.permalink} target="_blank" rel="noopener noreferrer">
                      View post
                    </a>
                  </>
                )}
              </span>
            </div>
            <span className="post-list-reach">{formatMetric(p.reach)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PostInsights({ insights }) {
  if (!insights) return null;
  const { findings = [], formats = [], top_posts, bottom_posts, post_count, period_start, period_end } = insights;
  const maxMedian = Math.max(...formats.map((f) => f.median_reach), 1);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="section-title">Why it changed</h2>
          <p className="section-subtitle">
            Based on {post_count} posts from {formatDay(period_start)} to {formatDay(period_end)}. Each point below shows the
            numbers behind it.
          </p>
        </div>
      </div>

      {findings.length === 0 ? (
        <p className="panel-text">No clear pattern stands out yet. More posts will make the comparison more reliable.</p>
      ) : (
        <ul className="findings">
          {findings.map((f) => (
            <li key={f.id} className="finding">
              <span className={`health-pill health-pill-${TONE_LEVEL[f.tone] || "watch"} finding-title`}>{f.title}</span>
              <p className="finding-detail">{f.detail}</p>
              {f.action && <p className="finding-action">{f.action}</p>}
            </li>
          ))}
        </ul>
      )}

      {formats.length > 1 && (
        <div className="format-compare">
          <h3 className="post-list-title">Median reach by format</h3>
          {formats.map((f) => (
            <div key={f.type} className="format-row">
              <span className="format-name">{FORMAT_LABEL[f.type] || f.type}</span>
              <span className="format-bar">
                <span style={{ width: `${Math.max(4, (f.median_reach / maxMedian) * 100)}%` }} />
              </span>
              <span className="format-value">{formatMetric(f.median_reach)}</span>
              <span className="format-count">
                {f.posts} {f.posts === 1 ? "post" : "posts"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="post-lists">
        <PostList title="Best posts" posts={top_posts} />
        <PostList title="Weakest posts" posts={bottom_posts} />
      </div>
    </section>
  );
}

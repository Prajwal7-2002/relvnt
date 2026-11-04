"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useReportDetails } from "../../lib/branding";
import { MIN_POSTS, RECENT_POSTS, analyzeSnapshot, parseViews } from "../../lib/snapshot";

const TYPES = ["Reel", "Photo", "Carousel", "Video"];
const MAX_ROWS = 15;
const emptyRows = (count) => Array.from({ length: count }, () => ({ type: "Reel", views: "" }));
const n = (v) => Math.round(v).toLocaleString("en-IN");

export default function SnapshotView({ agency }) {
  const details = useReportDetails();
  const cardRef = useRef(null);
  const [handle, setHandle] = useState("");
  const [rows, setRows] = useState(emptyRows(12));
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);


  const posts = rows
    .map((r) => ({ type: r.type, views: r.views === "" ? NaN : Number(r.views) }))
    .filter((p) => Number.isFinite(p.views));
  const result = useMemo(() => analyzeSnapshot(posts), [JSON.stringify(posts)]); // eslint-disable-line react-hooks/exhaustive-deps
  const cleanHandle = handle.trim() ? `@${handle.trim().replace(/^@/, "")}` : "@account";
  const maxViews = result ? Math.max(...result.bars.map((b) => b.views), 1) : 1;
  const hasCard = Boolean(result);

  // Scale the on-screen preview to fit narrow screens. Only the outer frame is
  // scaled, so the downloaded image keeps its full 1080 x 1350 size.
  const frameRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, height: null });
  useEffect(() => {
    const frame = frameRef.current;
    const card = cardRef.current;
    if (!frame || !card || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const scale = Math.min(1, frame.clientWidth / card.offsetWidth);
      const height = card.offsetHeight * scale;
      setFit((prev) => (prev.scale === scale && prev.height === height ? prev : { scale, height }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(card);
    measure();
    return () => observer.disconnect();
  }, [hasCard]);

  const updateRow = (i, field) => (e) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: e.target.value } : r)));

  const fillFromPaste = () => {
    const views = parseViews(paste).slice(0, MAX_ROWS);
    if (!views.length) {
      setError("No numbers found. Paste one view count per line, e.g. 12.4K or 1,203.");
      return;
    }
    setError(null);
    const next = views.map((v, i) => ({ type: rows[i]?.type || "Reel", views: String(v) }));
    setRows(next.length < MIN_POSTS ? [...next, ...emptyRows(MIN_POSTS - next.length)] : next);
  };

  const download = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#F3F0E8" });
      const link = document.createElement("a");
      link.href = url;
      link.download = `${cleanHandle.replace(/^@/, "")}-free-check-up.png`;
      link.click();
    } catch {
      setError("Couldn't create the image. Try again, or take a screenshot of the card.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="snapshot-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Free snapshot</h1>
          <p className="page-subtitle">
            A shareable check-up from an account&apos;s public view counts. Send it as your first message to a prospect.
          </p>
        </div>
      </div>

      <div className="snapshot-layout">
        <section className="panel">
          <label className="field-label" htmlFor="snap-handle">Instagram handle</label>
          <input id="snap-handle" className="text-input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@cafe_bloom" />

          <label className="field-label snapshot-gap" htmlFor="snap-paste">
            Paste view counts <span className="field-optional">(newest first, one per line)</span>
          </label>
          <textarea id="snap-paste" className="text-input snapshot-paste" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"1.2K\n980\n1,450\n…"} />
          <div className="snapshot-paste-actions">
            <button type="button" className="btn-secondary btn-sm" onClick={fillFromPaste}>
              Fill rows
            </button>
            <span className="dialog-hint">Skip posts from the last 3 days. They are still collecting views.</span>
          </div>

          <div className="snapshot-rows" role="table" aria-label="Recent posts">
            <div className="snapshot-row snapshot-row-head" role="row">
              <span>Post</span>
              <span>Format</span>
              <span>Views</span>
            </div>
            {rows.map((r, i) => (
              <div key={i} className="snapshot-row" role="row">
                <span className="snapshot-index">{i === 0 ? "Latest" : `#${i + 1}`}</span>
                <select className="text-input" value={r.type} onChange={updateRow(i, "type")} aria-label={`Post ${i + 1} format`}>
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input
                  className="text-input"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={r.views}
                  onChange={updateRow(i, "views")}
                  aria-label={`Post ${i + 1} views`}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div className="snapshot-row-actions">
            {rows.length < MAX_ROWS && (
              <button type="button" className="link-button" onClick={() => setRows([...rows, ...emptyRows(1)])}>
                Add a post
              </button>
            )}
            <button type="button" className="link-button" onClick={() => { setRows(emptyRows(12)); setPaste(""); }}>
              Clear
            </button>
          </div>
        </section>

        <section className="snapshot-preview">
          {!result ? (
            <div className="panel empty-state">
              <p className="empty-state-title">Add at least {MIN_POSTS} posts</p>
              <p className="empty-state-text">The card appears here as soon as there are enough view counts to compare.</p>
            </div>
          ) : (
            <>
              <div className="snap-frame" ref={frameRef} style={{ height: fit.height ?? undefined }}>
              <div className="snap-scale" style={{ transform: `scale(${fit.scale})` }}>
              <div className="snap-card" ref={cardRef}>
                <div className="snap-brand">
                  {details.logo ? <img src={details.logo} alt="" className="snap-logo" /> : <span className="snap-monogram">{agency.monogram}</span>}
                  <span className="snap-agency">{agency.name}</span>
                  <span className="snap-label">Free Instagram check-up</span>
                </div>

                <div className="snap-handle">{cleanHandle}</div>
                <h2 className={`snap-headline snap-${result.trend}`}>{result.headline}</h2>

                <div className="snap-stats">
                  <div>
                    <span>Latest {result.recentCount} posts</span>
                    <strong>{n(result.recentMedian)}</strong>
                    <small>typical views</small>
                  </div>
                  <div>
                    <span>{result.earlierCount} posts before</span>
                    <strong>{n(result.earlierMedian)}</strong>
                    <small>typical views</small>
                  </div>
                </div>

                <div className="snap-chart" aria-hidden="true">
                  {result.bars.map((b, i) => (
                    <div key={i} className="snap-bar-wrap">
                      <div className={`snap-bar ${b.recent ? "snap-bar-recent" : ""}`} style={{ height: `${Math.max(3, (b.views / maxViews) * 100)}%` }} />
                      <span className="snap-bar-type">{b.type[0]}</span>
                    </div>
                  ))}
                </div>
                <div className="snap-chart-legend">
                  <span><i className="snap-key" /> Earlier posts</span>
                  <span><i className="snap-key snap-key-recent" /> Latest {RECENT_POSTS}</span>
                  <span>R reel · P photo · C carousel · V video</span>
                </div>

                <ul className="snap-observations">
                  {result.observations.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>

                <div className="snap-cta">
                  Want to know why, and what to post instead? A full audit of the last 90 days shows exactly what to change.
                  {(details.phone || agency.contact) && (
                    <strong>
                      {details.phone ? `WhatsApp ${details.phone}` : agency.contact}
                      {details.website ? ` · ${details.website}` : ""}
                    </strong>
                  )}
                </div>

                <p className="snap-note">
                  Based on public view counts of {result.count} recent posts. Views keep growing for a few days after posting, so
                  posts from the last 3 days are not included.
                </p>
              </div>
              </div>
              </div>

              <div className="snapshot-download">
                <button type="button" className="btn-primary" onClick={download} disabled={busy}>
                  {busy ? "Creating image…" : "Download image"}
                </button>
                {!details.phone && (
                  <span className="dialog-hint">Add your WhatsApp number in Settings → Report details to show it on the card.</span>
                )}
              </div>
            </>
          )}
          {error && <p className="field-error">{error}</p>}
        </section>
      </div>
    </div>
  );
}

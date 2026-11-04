// Free snapshot from public numbers only: view counts of an account's recent posts.
// Small samples, so comparisons use medians ("typical views") and minimum counts,
// and the card says exactly what it is based on.

export const RECENT_POSTS = 4;
export const MIN_POSTS = 6;
const STEADY_BAND = 0.15;
const MIN_PER_FORMAT = 2;
const FORMAT_RATIO = 1.5;

const PLURAL = { Reel: "reels", Photo: "photos", Carousel: "carousels", Video: "videos" };

export function median(values) {
  const v = [...values].sort((a, b) => a - b);
  if (!v.length) return 0;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

const n = (value) => Math.round(value).toLocaleString("en-IN");

/**
 * Parse pasted numbers like "12.4K, 980\n1,203" (newest first). A comma followed by a
 * space separates items; a comma inside a number ("1,203") is a thousands separator.
 */
export function parseViews(text) {
  return String(text || "")
    .split(/[\n;\t]+|,\s+|\s{2,}/)
    .map((token) => token.trim().toLowerCase().replace(/,/g, ""))
    .filter(Boolean)
    .map((token) => {
      const m = token.match(/^(\d+(?:\.\d+)?)\s*([km])?$/);
      if (!m) return null;
      const mult = m[2] === "k" ? 1000 : m[2] === "m" ? 1000000 : 1;
      return Math.round(parseFloat(m[1]) * mult);
    })
    .filter((v) => v !== null);
}

/**
 * posts: [{ type: "Reel" | "Photo" | "Carousel" | "Video", views: number }], newest first.
 * Returns null when there are too few posts to say anything honest.
 */
export function analyzeSnapshot(posts) {
  const valid = (posts || []).filter((p) => Number.isFinite(p.views) && p.views >= 0);
  if (valid.length < MIN_POSTS) return null;

  const recent = valid.slice(0, RECENT_POSTS);
  const earlier = valid.slice(RECENT_POSTS);
  const recentMedian = median(recent.map((p) => p.views));
  const earlierMedian = median(earlier.map((p) => p.views));
  const change = earlierMedian > 0 ? (recentMedian - earlierMedian) / earlierMedian : 0;
  const trend = Math.abs(change) < STEADY_BAND ? "steady" : change < 0 ? "down" : "up";

  const headline =
    trend === "down"
      ? `Recent posts are getting ${Math.abs(change * 100).toFixed(0)}% fewer views`
      : trend === "up"
      ? `Recent posts are getting ${Math.abs(change * 100).toFixed(0)}% more views`
      : "Views are holding steady";

  const observations = [];

  // Format comparison (only formats with enough posts)
  const byType = {};
  valid.forEach((p) => (byType[p.type] = byType[p.type] || []).push(p.views));
  const formats = Object.entries(byType)
    .filter(([, views]) => views.length >= MIN_PER_FORMAT)
    .map(([type, views]) => ({ type, median: median(views), count: views.length }))
    .sort((a, b) => b.median - a.median);

  if (formats.length >= 2) {
    const best = formats[0];
    const worst = formats[formats.length - 1];
    const ratio = best.median / Math.max(worst.median, 1);
    if (ratio >= FORMAT_RATIO) {
      const bestWord = PLURAL[best.type] || best.type.toLowerCase();
      const worstWord = PLURAL[worst.type] || worst.type.toLowerCase();
      observations.push(
        `${bestWord[0].toUpperCase()}${bestWord.slice(1)} get ${ratio.toFixed(1)}x the views of ${worstWord} (typical ${n(best.median)} vs ${n(worst.median)}).`
      );
      const recentBest = recent.filter((p) => p.type === best.type).length;
      const earlierShare = earlier.length ? earlier.filter((p) => p.type === best.type).length / earlier.length : 0;
      if (recentBest / recent.length + 0.2 <= earlierShare) {
        observations.push(
          `Only ${recentBest} of the latest ${recent.length} posts ${recentBest === 1 ? `was a ${best.type.toLowerCase()}` : `were ${bestWord}`}, fewer than before.`
        );
      }
    }
  }

  const top = valid.reduce((a, b) => (b.views > a.views ? b : a));
  const topIndex = valid.indexOf(top);
  observations.push(
    `The best of these posts reached ${n(top.views)} views (a ${top.type.toLowerCase()}, ${topIndex === 0 ? "the latest post" : `${topIndex + 1} posts ago`}).`
  );

  return {
    count: valid.length,
    recentCount: recent.length,
    earlierCount: earlier.length,
    recentMedian,
    earlierMedian,
    change,
    trend,
    headline,
    observations: observations.slice(0, 3),
    formats,
    // Oldest -> newest for the bar chart
    bars: [...valid].reverse().map((p, i, arr) => ({ ...p, recent: i >= arr.length - RECENT_POSTS })),
  };
}

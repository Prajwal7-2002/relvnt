// Single source of truth for health thresholds, matching the backend radar
// (critical < 40, watch < 70) and the health range bar.
export const HEALTH_LEVELS = {
  critical: { key: "critical", label: "Critical", tone: "drift" },
  watch: { key: "watch", label: "Watch", tone: "warning" },
  healthy: { key: "healthy", label: "Healthy", tone: "nominal" },
};

export function healthLevel(score) {
  const s = Number.isFinite(score) ? score : 50;
  if (s < 40) return HEALTH_LEVELS.critical;
  if (s < 70) return HEALTH_LEVELS.watch;
  return HEALTH_LEVELS.healthy;
}

export function needsAttention(score) {
  return healthLevel(score).key !== "healthy";
}

const PLATFORM_LABELS = {
  instagram: "Instagram",
  meta_ads: "Meta Ads",
  "meta ads": "Meta Ads",
  uploaded_csv: "CSV upload",
  custom: "Manual entry",
  google_sheets: "Google Sheets",
};

export function platformLabel(platform) {
  if (!platform) return "Instagram";
  return PLATFORM_LABELS[String(platform).toLowerCase()] || platform;
}

// Sample datasets carry descriptive suffixes ("@tech_founder (Distribution Shock)");
// show just the account name
export function displayName(name) {
  return String(name || "").replace(/\s*\([^)]*\)\s*$/, "").trim() || "Account";
}

// ROAS is a ratio (2.8x); reach and impressions are counts (13,457)
export function formatMetric(value, metricType) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "–";
  const n = Number(value);
  if (metricType === "roas") return `${n.toFixed(1)}x`;
  return Math.round(n).toLocaleString("en-US");
}

// What the client report says by default, generated from the analysis. The report
// editor starts from this, and the report prints the edited version when there is one.
export function defaultReportContent(data) {
  if (!data) return { summary: "", findings: [], steps: [], note: "" };
  const insights = data.post_insights;
  // The reach trend is already shown by the summary and before/after cards
  const source = insights
    ? (insights.findings || []).filter((f) => !(insights.comparison && f.id === "trend"))
    : data.findings || [];
  return {
    summary: data.diagnosis || "",
    findings: source.slice(0, 4).map((f) => ({ title: f.title, detail: f.detail })),
    steps: (data.protocol_phases || []).slice(0, 3).map((s) => ({ title: s.title, action: s.action })),
    note: "",
  };
}

export const MAX_REPORT_FINDINGS = 5;
export const MAX_REPORT_STEPS = 5;

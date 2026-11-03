"use client";

import { useMemo } from "react";

export default function AnomalyTable({ data }) {
  const anomalies = data?.anomalies || [];
  const reachData = data?.reach_data || [];
  const isRoas = data?.metric_type === "roas";

  // Map reachData dates to expected_reach baselines
  const baselineMap = useMemo(() => {
    const map = {};
    reachData.forEach((pt) => {
      if (pt.date) {
        map[pt.date] = pt.expected_reach || pt.expected_value || pt.baseline;
      }
    });
    return map;
  }, [reachData]);

  // Combine anomaly points with their expected baseline & variance
  const incidentRows = useMemo(() => {
    return anomalies
      .map((a) => {
        const baseline = baselineMap[a.date] || data?.metrics_summary?.baseline_avg || a.value;
        const diff = a.value - baseline;
        const variancePct = baseline > 0 ? (diff / baseline) * 100 : 0;
        
        let classification = "Velocity Variance";
        if (variancePct <= -45) classification = "Explore Decoupling (Critical)";
        else if (variancePct <= -25) classification = "Retention Contraction";
        else if (variancePct > 0) classification = "Viral Discovery Surge";

        return {
          date: a.date,
          value: a.value,
          baseline: baseline,
          variancePct: variancePct,
          deviation: a.deviation,
          classification: classification,
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [anomalies, baselineMap, data?.metrics_summary?.baseline_avg]);

  return (
    <section className="anomaly-table-card">
      <div className="anomaly-table-header">
        <div>
          <h3 className="anomaly-table-title">Forensic Algorithmic Incident Log</h3>
          <p className="anomaly-table-subtitle">
            Outlier suppression events detected via 5D Isolation Forest and 14-day rolling de-seasonalization.
          </p>
        </div>
        <div className="anomaly-count-pill">
          <span>{incidentRows.length} Incidents Flagged</span>
        </div>
      </div>

      {incidentRows.length === 0 ? (
        <div className="anomaly-table-empty">
          <span>✓ Nominal Equilibrium: Zero critical distribution suppression events detected in observation window.</span>
        </div>
      ) : (
        <div className="anomaly-table-wrapper">
          <table className="anomaly-data-table">
            <thead>
              <tr>
                <th>Incident Date</th>
                <th>Observed Value</th>
                <th>Expected Baseline</th>
                <th>Net Variance</th>
                <th>Anomaly Score</th>
                <th>Algorithmic Classification</th>
              </tr>
            </thead>
            <tbody>
              {incidentRows.slice(0, 10).map((row, idx) => (
                <tr key={idx}>
                  <td className="mono-num font-semibold">{row.date}</td>
                  <td className="mono-num">
                    {isRoas ? `${row.value.toFixed(2)}x` : Math.round(row.value).toLocaleString()}
                  </td>
                  <td className="mono-num text-dim">
                    {isRoas ? `${row.baseline.toFixed(2)}x` : Math.round(row.baseline).toLocaleString()}
                  </td>
                  <td className="mono-num font-semibold" style={{ color: row.variancePct < 0 ? "var(--status-critical)" : "var(--status-good)" }}>
                    {row.variancePct > 0 ? `+${row.variancePct.toFixed(1)}%` : `${row.variancePct.toFixed(1)}%`}
                  </td>
                  <td className="mono-num text-dim">
                    {row.deviation ? `${row.deviation.toFixed(1)}σ` : "N/A"}
                  </td>
                  <td>
                    <span
                      className="classification-tag"
                      style={{
                        backgroundColor:
                          row.variancePct <= -40
                            ? "var(--status-drift-bg)"
                            : row.variancePct < 0
                            ? "var(--status-warning-bg)"
                            : "var(--status-nominal-bg)",
                        color:
                          row.variancePct <= -40
                            ? "var(--status-critical)"
                            : row.variancePct < 0
                            ? "var(--status-warn)"
                            : "var(--status-good)",
                        borderColor:
                          row.variancePct <= -40
                            ? "var(--status-drift-border)"
                            : row.variancePct < 0
                            ? "var(--status-warning-border)"
                            : "var(--status-nominal-border)",
                      }}
                    >
                      {row.classification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="anomaly-table-footer">
        <span>Confidential Algorithmic Telemetry • Certified by Relvnt Incident Protocol v1.2.0</span>
      </div>
    </section>
  );
}


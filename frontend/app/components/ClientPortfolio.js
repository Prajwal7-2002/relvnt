"use client";

export default function ClientPortfolio({
  portfolioList,
  onSelectClient,
  onOpenConnectModal,
  onOpenAgencyModal,
  agencyName,
  auditorName,
}) {
  const atRiskCount = portfolioList.filter((c) => (c.health_score || 50) < 50).length;
  const healthyCount = portfolioList.filter((c) => (c.health_score || 50) >= 70).length;

  return (
    <div className="portfolio-container">
      {/* PORTFOLIO EXECUTIVE HEADER */}
      <div className="portfolio-header-card">
        <div className="portfolio-header-left">
          <div className="portfolio-agency-badge">
            <span className="portfolio-agency-dot" />
            <span>AGENCY WORKSPACE • {agencyName.toUpperCase()}</span>
          </div>
          <h2 className="portfolio-title">Client Distribution Portfolio</h2>
          <p className="portfolio-subtitle">
            Centralized algorithmic anomaly radar and client retainer protection ledger. Managed by {auditorName}.
          </p>
        </div>

        <div className="portfolio-header-actions">
          <button onClick={onOpenAgencyModal} className="btn-secondary" title="Configure agency co-branding">
            ⚙️ Agency Branding
          </button>
          <button onClick={onOpenConnectModal} className="btn-audit-ingest">
            + Ingest New Client Data
          </button>
        </div>
      </div>

      {/* QUICK KPI METRICS BANNER */}
      <div className="portfolio-metrics-grid">
        <div className="portfolio-metric-box">
          <span className="portfolio-metric-label">Total Accounts Monitored</span>
          <span className="portfolio-metric-value mono-num">{portfolioList.length}</span>
          <span className="portfolio-metric-sub">Multi-platform radar coverage</span>
        </div>

        <div className="portfolio-metric-box">
          <span className="portfolio-metric-label">Accounts Under Algorithmic Risk</span>
          <span className="portfolio-metric-value mono-num text-critical">{atRiskCount}</span>
          <span className="portfolio-metric-sub">Requires 72h turnaround execution</span>
        </div>

        <div className="portfolio-metric-box">
          <span className="portfolio-metric-label">Accounts In Equilibrium</span>
          <span className="portfolio-metric-value mono-num text-good">{healthyCount}</span>
          <span className="portfolio-metric-sub">Nominal baseline distribution</span>
        </div>

        <div className="portfolio-metric-box">
          <span className="portfolio-metric-label">Retainer Retention Assurance</span>
          <span className="portfolio-metric-value mono-num text-good">100%</span>
          <span className="portfolio-metric-sub">Objective third-party audit coverage</span>
        </div>
      </div>

      {/* CLIENT ACCOUNTS LEDGER TABLE */}
      <div className="portfolio-table-card">
        <div className="portfolio-table-topbar">
          <h3 className="portfolio-table-heading">Client Account Telemetry Ledger</h3>
          <span className="portfolio-table-count mono-num">{portfolioList.length} Accounts Synchronized</span>
        </div>

        <div className="anomaly-table-wrapper">
          <table className="anomaly-data-table">
            <thead>
              <tr>
                <th>Target Client</th>
                <th>Platform</th>
                <th>Health Index</th>
                <th>Current vs Baseline</th>
                <th>Active Algorithmic State</th>
                <th>Last Audit</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolioList.map((client) => {
                const score = client.health_score || 50;
                const isCrit = score < 50;
                const isWarn = score >= 50 && score < 70;
                const statusColor = isCrit ? "var(--status-critical)" : isWarn ? "var(--status-warn)" : "var(--status-good)";

                return (
                  <tr key={client.id || client.account}>
                    <td>
                      <div className="client-cell-name">
                        <span className="client-handle font-semibold">{client.account}</span>
                        {client.tag && <span className="client-subtag mono-num">{client.tag}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="account-platform-tag">{client.platform || "Instagram"}</span>
                    </td>
                    <td>
                      <div className="health-score-cell">
                        <span
                          className="health-score-indicator"
                          style={{ backgroundColor: statusColor }}
                        />
                        <span className="mono-num font-semibold" style={{ color: statusColor }}>
                          {score}/100
                        </span>
                      </div>
                    </td>
                    <td className="mono-num">
                      <div style={{ fontSize: "12.5px" }}>
                        <span>{client.current ? Math.round(client.current).toLocaleString() : "N/A"}</span>
                        <span className="text-dim"> / {client.baseline ? Math.round(client.baseline).toLocaleString() : "N/A"}</span>
                        {client.change_pct !== undefined && (
                          <span
                            style={{
                              marginLeft: "6px",
                              fontWeight: 600,
                              color: client.change_pct < 0 ? "var(--status-critical)" : "var(--status-good)",
                            }}
                          >
                            ({client.change_pct > 0 ? `+${client.change_pct}%` : `${client.change_pct}%`})
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className="classification-tag"
                        style={{
                          backgroundColor: isCrit ? "rgba(185, 28, 28, 0.12)" : isWarn ? "rgba(217, 119, 6, 0.12)" : "rgba(21, 128, 61, 0.12)",
                          color: statusColor,
                          borderColor: isCrit ? "rgba(185, 28, 28, 0.3)" : isWarn ? "rgba(217, 119, 6, 0.3)" : "rgba(21, 128, 61, 0.3)",
                        }}
                      >
                        {client.status || "Analyzing"}
                      </span>
                    </td>
                    <td className="text-dim mono-num" style={{ fontSize: "12px" }}>
                      {client.last_audited || "Just now"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => onSelectClient(client.id || client.preset || "instagram_drop")}
                        className="btn-portfolio-inspect"
                      >
                        Inspect Audit →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

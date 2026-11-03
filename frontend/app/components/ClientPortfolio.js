"use client";

import { useState } from "react";

// "shock" / "pre_shock" / "Creative Fatigue" -> consistent Title Case labels
function formatStatus(status) {
  if (!status) return "Analyzing";
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ClientPortfolio({
  portfolioList,
  onSelectClient,
  onOpenConnectModal,
  onOpenAgencyModal,
  agencyName,
  auditorName,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const atRiskCount = portfolioList.filter((c) => (c.health_score || 50) < 50).length;
  const healthyCount = portfolioList.filter((c) => (c.health_score || 50) >= 70).length;

  const filteredList = portfolioList.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.account || "").toLowerCase().includes(q) ||
      (c.platform || "").toLowerCase().includes(q) ||
      (c.status || "").toLowerCase().includes(q)
    );
  });

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

        <div className="portfolio-header-actions" style={{ display: "flex", gap: "10px" }}>
          <button onClick={onOpenAgencyModal} className="btn-secondary" title="Configure agency co-branding">
            Agency Branding
          </button>
          <button onClick={onOpenConnectModal} className="btn-primary">
            + Quick Ingest Client Data
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
          <span className="portfolio-metric-value mono-num" style={{ color: "var(--status-drift)" }}>{atRiskCount}</span>
          <span className="portfolio-metric-sub">Requires 72h turnaround execution</span>
        </div>

        <div className="portfolio-metric-box">
          <span className="portfolio-metric-label">Accounts In Equilibrium</span>
          <span className="portfolio-metric-value mono-num" style={{ color: "var(--status-nominal)" }}>{healthyCount}</span>
          <span className="portfolio-metric-sub">Nominal baseline distribution</span>
        </div>

        <div className="portfolio-metric-box">
          <span className="portfolio-metric-label">Retainer Retention Assurance</span>
          <span className="portfolio-metric-value mono-num" style={{ color: "var(--status-nominal)" }}>100%</span>
          <span className="portfolio-metric-sub">Objective third-party audit coverage</span>
        </div>
      </div>

      {/* CLIENT ACCOUNTS LEDGER TABLE */}
      <div className="portfolio-table-card">
        <div className="portfolio-table-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <h3 className="portfolio-table-heading">Client Account Telemetry Ledger</h3>
            <span className="portfolio-table-count mono-num">({filteredList.length} Accounts)</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="text"
              placeholder="Search by handle or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-text-field"
              style={{ width: "220px", padding: "6px 10px", fontSize: "var(--font-size-sm)" }}
            />
          </div>
        </div>

        <div className="anomaly-table-wrapper">
          {filteredList.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "var(--font-size-base)", fontWeight: 600, color: "var(--text-primary)" }}>No Client Accounts Found</div>
              <p style={{ fontSize: "var(--font-size-sm)", margin: "4px 0 16px 0" }}>
                {searchQuery ? `No accounts matched search term "${searchQuery}".` : "Your portfolio does not have any tracked accounts yet."}
              </p>
              <button onClick={onOpenConnectModal} className="btn-primary" style={{ margin: "0 auto" }}>
                + Add Client Account
              </button>
            </div>
          ) : (
            <table className="anomaly-data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Platform</th>
                  <th>Health</th>
                  <th>Current vs Baseline</th>
                  <th>Status</th>
                  <th>Last Audit</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((client) => {
                  const score = client.health_score || 50;
                  // Same thresholds as the health range bar and radar alerts
                  const isCrit = score < 40;
                  const isWarn = score >= 40 && score < 70;
                  const statusColor = isCrit ? "var(--status-drift)" : isWarn ? "var(--status-warning)" : "var(--status-nominal)";

                  return (
                    <tr key={client.id || client.account}>
                      <td>
                        <div className="client-cell-name">
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{client.account}</span>
                          {client.tag && (
                            <span style={{
                              marginLeft: "8px",
                              fontSize: "var(--font-size-2xs)",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: "var(--bg-surface-subtle)",
                              color: "var(--text-muted)",
                            }}>
                              {client.tag}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="account-platform-tag">{client.platform || "Instagram"}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: statusColor,
                              display: "inline-block",
                            }}
                          />
                          <span className="mono-num font-semibold" style={{ color: statusColor, fontSize: "var(--font-size-sm)" }}>
                            {score}/100
                          </span>
                        </div>
                      </td>
                      <td className="mono-num">
                        <div style={{ fontSize: "var(--font-size-sm)", whiteSpace: "nowrap" }}>
                          <span>{client.current ? Math.round(client.current).toLocaleString() : "N/A"}</span>
                          <span style={{ color: "var(--text-dim)" }}> / {client.baseline ? Math.round(client.baseline).toLocaleString() : "N/A"}</span>
                          {client.change_pct !== undefined && (
                            <span
                              style={{
                                marginLeft: "6px",
                                fontWeight: 600,
                                color: client.change_pct < 0 ? "var(--status-drift)" : "var(--status-nominal)",
                              }}
                            >
                              ({client.change_pct > 0 ? `+${client.change_pct}%` : `${client.change_pct}%`})
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "var(--font-size-xs)",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            backgroundColor: isCrit ? "var(--status-drift-bg)" : isWarn ? "var(--status-warning-bg)" : "var(--status-nominal-bg)",
                            color: statusColor,
                            border: `1px solid ${isCrit ? "var(--status-drift-border)" : isWarn ? "var(--status-warning-border)" : "var(--status-nominal-border)"}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatStatus(client.status)}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-dim)", fontSize: "var(--font-size-sm)" }}>
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
          )}
        </div>
      </div>
    </div>
  );
}

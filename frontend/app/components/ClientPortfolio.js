"use client";

import { useMemo, useState } from "react";
import { formatMetric, healthLevel, platformLabel } from "../../lib/health";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "watch", label: "Watch" },
  { id: "healthy", label: "Healthy" },
];

export default function ClientPortfolio({ portfolioList, onSelectClient, onOpenConnectModal, agencyName }) {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const rows = useMemo(
    () => portfolioList.map((client) => ({ ...client, level: healthLevel(client.health_score) })),
    [portfolioList]
  );

  const counts = useMemo(() => {
    const c = { all: rows.length, critical: 0, watch: 0, healthy: 0 };
    rows.forEach((r) => (c[r.level.key] += 1));
    return c;
  }, [rows]);

  const visibleRows = rows.filter((r) => {
    if (filter !== "all" && r.level.key !== filter) return false;
    const q = searchQuery.trim().toLowerCase();
    return !q || r.account.toLowerCase().includes(q) || platformLabel(r.platform).toLowerCase().includes(q);
  });

  const attention = counts.critical + counts.watch;
  const openClient = (client) => onSelectClient(client.id || client.preset || "instagram_drop");

  return (
    <div className="clients-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">
            {counts.all} {counts.all === 1 ? "account" : "accounts"} monitored for {agencyName}
            {attention > 0 && (
              <>
                {" · "}
                <span className="text-attention">{attention} need attention</span>
              </>
            )}
          </p>
        </div>
        <div className="page-actions">
          <button onClick={onOpenConnectModal} className="btn-primary">
            Add client
          </button>
        </div>
      </div>

      <div className="summary-strip">
        {["critical", "watch", "healthy"].map((key) => (
          <button
            key={key}
            className={`summary-item summary-${key} ${filter === key ? "summary-item-active" : ""}`}
            onClick={() => setFilter(filter === key ? "all" : key)}
          >
            <span className="summary-label">
              <span className={`status-dot status-dot-${key}`} />
              {FILTERS.find((f) => f.id === key).label}
            </span>
            <span className="summary-value">{counts[key]}</span>
            <span className="summary-hint">
              {key === "critical" && "Reach well below usual. Act now."}
              {key === "watch" && "Trending down. Keep an eye on it."}
              {key === "healthy" && "Performing as expected."}
            </span>
          </button>
        ))}
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="filter-tabs" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                className={`filter-tab ${filter === f.id ? "filter-tab-active" : ""}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className="filter-tab-count">{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Search clients"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="table-search"
            aria-label="Search clients"
          />
        </div>

        {visibleRows.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">{searchQuery ? "No matching clients" : "No clients here yet"}</p>
            <p className="empty-state-text">
              {searchQuery
                ? `Nothing matches "${searchQuery}".`
                : "Add a client by uploading a CSV export or connecting a Google Sheet."}
            </p>
            {!searchQuery && (
              <button onClick={onOpenConnectModal} className="btn-primary">
                Add client
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Health</th>
                  <th className="num col-optional">Current</th>
                  <th className="num col-optional">Usual</th>
                  <th className="num">Change</th>
                  <th className="col-optional">Last checked</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((client) => {
                  const change = Number(client.change_pct);
                  const hasChange = Number.isFinite(change);
                  return (
                    <tr
                      key={client.id || client.account}
                      className="data-row"
                      tabIndex={0}
                      onClick={() => openClient(client)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openClient(client)}
                    >
                      <td>
                        <div className="client-name">{client.account}</div>
                        <div className="client-meta">
                          {platformLabel(client.platform)}
                          {client.tag && /benchmark/i.test(client.tag) && <span className="sample-tag">Sample data</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`health-pill health-pill-${client.level.key}`}>
                          <span className="health-pill-score">{client.health_score ?? "–"}</span>
                          {client.level.label}
                        </span>
                      </td>
                      <td className="num col-optional">{formatMetric(client.current, client.metric_type)}</td>
                      <td className="num text-muted col-optional">{formatMetric(client.baseline, client.metric_type)}</td>
                      <td className={`num ${hasChange ? (change < 0 ? "text-down" : "text-up") : "text-muted"}`}>
                        {hasChange ? `${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change).toFixed(1)}%` : "–"}
                      </td>
                      <td className="text-muted col-optional">{client.last_audited || "–"}</td>
                      <td className="row-chevron" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

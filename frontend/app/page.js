"use client";

import { useEffect, useRef, useState } from "react";
import ActionCard from "./components/ActionCard";
import HealthScore from "./components/HealthScore";
import ReachChart from "./components/ReachChart";

const PRESETS = [
  { id: "instagram_drop", label: "Instagram Reach Suppression", account: "@tech_founder" },
  { id: "meta_ads_fatigue", label: "Meta Ads Creative Fatigue", account: "US Retargeting" },
  { id: "real_creator", label: "Authentic Creator Insights", account: "99 Days Post History" },
  { id: "healthy_growth", label: "Equilibrium Baseline Growth", account: "@growth_studio" },
];

export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePreset, setActivePreset] = useState("instagram_drop");
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState([]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAnalysis = async (presetKey = "instagram_drop") => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/analyze?preset=${presetKey}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Analysis engine responded with status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setActivePreset(presetKey);
    } catch (err) {
      setError(err.message || "Failed to connect to local anomaly engine");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis("instagram_drop");
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/analyze/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.detail || `Upload failed with status ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      setActivePreset("custom_upload");
      setShowUploadModal(false);
    } catch (err) {
      setError(err.message || "Failed to process CSV file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopilotSend = async (customText = null) => {
    const queryText = (customText || copilotInput).trim();
    if (!queryText || copilotLoading) return;

    const newMessages = [...copilotMessages, { role: "user", text: queryText }];
    setCopilotMessages(newMessages);
    setCopilotInput("");
    setCopilotLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: queryText,
          account_name: data?.account_name || "Account",
          platform: data?.platform || "instagram",
          metric_type: data?.metric_type || "reach",
          health_score: data?.health_score || 50,
          metrics: data?.metrics_summary || {},
          anomalies: data?.anomalies || [],
          diagnosis: data?.diagnosis || "",
        }),
      });

      if (!res.ok) {
        throw new Error(`Copilot response status ${res.status}`);
      }

      const json = await res.json();
      setCopilotMessages((prev) => [
        ...prev,
        { role: "ai", text: json.answer, engine: json.engine },
      ]);
    } catch (err) {
      setCopilotMessages((prev) => [
        ...prev,
        { role: "ai", text: `Notice: ${err.message || "Failed to generate copilot response."}`, engine: "System" },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const metrics = data?.metrics_summary || {};
  const isRoas = data?.metric_type === "roas";
  const mlScore = Math.round((metrics.ml_anomaly_score || 0.1) * 100);

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        {/* PRESENTATION HEADER */}
        <header className="dashboard-header">
          <div className="brand-section">
            <div className="brand-row">
              <h1 className="brand-title">
                relvnt<span className="brand-dot">.</span>
              </h1>
            </div>
            <p className="brand-tagline">
              Algorithmic Relevance &amp; Distribution Early-Warning Radar
            </p>
          </div>

          <div className="header-actions">
            <button
              onClick={() => setShowCopilot(true)}
              className="btn-ai-analyst"
            >
              <span className="pulse-dot-ai" />
              <span>AI Growth Analyst</span>
            </button>
            <div className="enclave-badge">
              <span className="enclave-pulse" />
              <span>Zero-Data-Leak Enclave</span>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-upload-trigger"
            >
              <span>+</span> Ingest Performance CSV
            </button>
          </div>
        </header>

        {/* SIGNAL / BENCHMARK SELECTOR */}
        <div className="preset-bar">
          <span className="preset-title">Active Benchmark:</span>
          <div className="preset-tabs">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => fetchAnalysis(p.id)}
                className={`preset-btn ${activePreset === p.id ? "preset-btn-active" : ""}`}
              >
                <span>{p.label}</span>
                <span style={{ opacity: 0.6, fontSize: "11px", marginLeft: "6px" }}>({p.account})</span>
              </button>
            ))}
            {activePreset === "custom_upload" && (
              <span className="preset-btn preset-btn-active">
                Uploaded Custom Dataset
              </span>
            )}
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <section className="error-card">
            <p className="error-label">Engine Connection Notice</p>
            <h2>Analysis Engine Warning</h2>
            <p>{error}</p>
            <button onClick={() => fetchAnalysis(activePreset)} className="btn-retry">
              Retry Connection
            </button>
          </section>
        )}

        {/* EXECUTIVE KPI PRESENTATION STRIP */}
        {data && (
          <section className="stat-strip">
            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Current Velocity</span>
                <span className="stat-subtext">vs Model Baseline</span>
              </div>
              <div className="stat-value tabular-nums">
                {isRoas ? `${metrics.current_value}x` : Number(metrics.current_value).toLocaleString()}
                <span className="stat-baseline-tag">
                  / {isRoas ? `${metrics.baseline_avg}x` : Number(metrics.baseline_avg).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Net Velocity Drift</span>
                <span className="stat-subtext">7D Moving Median</span>
              </div>
              <div
                className="stat-value tabular-nums"
                style={{ color: Number(metrics.change_pct) < 0 ? "#F43F5E" : "#10B981" }}
              >
                {Number(metrics.change_pct) > 0 ? "+" : ""}
                {metrics.change_pct}%
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Machine Learning Risk</span>
                <span className="stat-subtext">IsolationForest (100 Trees)</span>
              </div>
              <div className="stat-value tabular-nums">
                <span style={{ color: metrics.ml_flagged ? "#F43F5E" : "#10B981" }}>
                  {mlScore}%
                </span>
                <span className="stat-baseline-tag">
                  ({metrics.ml_flagged ? "Outlier Decoupled" : "Nominal"} • {metrics.anomaly_count || 0} events)
                </span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Projected Impact</span>
                <span className="stat-subtext">7-Day Horizon</span>
              </div>
              <div
                className="stat-value tabular-nums"
                style={{ fontSize: "14.5px", color: "#F59E0B" }}
              >
                {metrics.projected_impact || "Nominal Equilibrium"}
              </div>
            </div>
          </section>
        )}

        {/* LOADING SKELETON */}
        {loading && !data && (
          <div className="loading-shell">
            <div className="terminal-scan-line" />
            <p className="loading-label">Evaluating Seasonality &amp; Machine Learning Vectors...</p>
          </div>
        )}

        {/* MAIN PRESENTATION GRID */}
        {data && (
          <>
            <section className="dashboard-grid">
              <HealthScore data={data} />
              <ReachChart data={data} />
            </section>

            <ActionCard data={data} />
          </>
        )}
      </div>

      {/* SLIDE-OVER AI GROWTH ANALYST DRAWER */}
      {showCopilot && (
        <>
          <div className="copilot-drawer-overlay" onClick={() => setShowCopilot(false)} />
          <aside className="copilot-drawer">
            <div className="copilot-drawer-header">
              <div className="copilot-drawer-title">
                <span className="pulse-dot-ai" />
                <h3>Relvnt AI Growth Analyst</h3>
              </div>
              <button onClick={() => setShowCopilot(false)} className="btn-close">
                ✕
              </button>
            </div>

            <div className="copilot-drawer-body">
              <div className="copilot-quick-chips">
                <span className="copilot-chips-label">Suggested Inquiries:</span>
                <button
                  onClick={() => handleCopilotSend("Why did this distribution drop occur and what caused the algorithm to throttle reach?")}
                  className="copilot-chip"
                >
                  Why did this distribution drop occur?
                </button>
                <button
                  onClick={() => handleCopilotSend("Draft a professional email for my client or brand sponsor explaining this temporary variance without alarming them.")}
                  className="copilot-chip"
                >
                  Draft executive brief for sponsor / client
                </button>
                <button
                  onClick={() => handleCopilotSend("What specific publishing format, hook length, and cadence should I post this week to reset the distribution algorithm?")}
                  className="copilot-chip"
                >
                  Recommend 72-hour turnaround content format
                </button>
              </div>

              {copilotMessages.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>
                  Ask questions about @{data?.account_name || "target"}&apos;s velocity, retention collapse, or recovery tactics.
                </div>
              )}

              {copilotMessages.map((msg, idx) => (
                <div key={idx} className="copilot-msg-item">
                  <span className="copilot-msg-meta">
                    {msg.role === "user" ? "Operator" : msg.engine || "Relvnt AI Analyst"}
                  </span>
                  <div
                    className={`copilot-msg-content ${
                      msg.role === "user" ? "copilot-msg-content-user" : "copilot-msg-content-ai"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {copilotLoading && (
                <div style={{ textAlign: "center", padding: "14px 0" }}>
                  <div className="terminal-scan-line" />
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    Synthesizing algorithmic intelligence...
                  </span>
                </div>
              )}
            </div>

            <div className="copilot-drawer-footer">
              <input
                type="text"
                placeholder="Ask about this account's performance..."
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCopilotSend()}
                className="copilot-input"
              />
              <button
                onClick={() => handleCopilotSend()}
                disabled={copilotLoading || !copilotInput.trim()}
                className="btn-copilot-send"
              >
                Send
              </button>
            </div>
          </aside>
        </>
      )}

      {/* CSV INGESTION MODAL */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ingest Performance Dataset</h3>
              <button onClick={() => setShowUploadModal(false)} className="btn-close">
                ✕
              </button>
            </div>
            <p className="modal-subhead">
              Accepts CSV exports from Instagram Insights (Reach, Impressions), Meta Ads Manager (ROAS, Spend),
              or YouTube Studio. Zero API credentials or tokens required.
            </p>

            <div
              className="dropzone-box"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <div className="dropzone-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="dropzone-title">Click to select or drop CSV file</p>
              <small>Auto-detects Date and Numeric columns in milliseconds</small>
            </div>

            <div className="sample-downloads-bar">
              <a href="/samples/real_instagram_sample.csv" download className="btn-sample-download">
                Download Real IG Sample
              </a>
              <a href="/samples/real_meta_ads_sample.csv" download className="btn-sample-download">
                Download Real Meta Ads Sample
              </a>
            </div>

            <div className="enclave-modal-notice">
              <strong>Zero-Data-Leak Privacy Guarantee:</strong> Ingested records are evaluated exclusively in local memory. No customer identifiers, financial numbers, or reach histories are stored to disk or used for external model training.
            </div>

            {isUploading && (
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <div className="terminal-scan-line" />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Normalizing time-series vectors...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

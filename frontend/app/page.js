"use client";

import { useEffect, useRef, useState } from "react";
import ActionCard from "./components/ActionCard";
import HealthScore from "./components/HealthScore";
import ReachChart from "./components/ReachChart";

const PRESETS = [
  { id: "instagram_drop", label: "[01] IG_SUPPRESSION // Distribution Shock", platform: "Instagram", metric: "Reach" },
  { id: "meta_ads_fatigue", label: "[02] META_ADS // Creative Fatigue (ROAS Decay)", platform: "Meta Ads", metric: "ROAS" },
  { id: "real_creator", label: "[03] REAL_CREATOR // Authentic History (99D)", platform: "Instagram", metric: "Reach" },
  { id: "healthy_growth", label: "[04] EQUILIBRIUM // Nominal Run-Rate", platform: "Instagram", metric: "Reach" },
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
        {/* MISSION-CONTROL HEADER */}
        <header className="dashboard-header">
          <div>
            <div className="brand-row">
              <span className="brand-emblem">[R]</span>
              <h1 className="brand-title">RELVNT</h1>
              <span className="brand-edition-tag">// SENTINEL RADAR v1.2</span>
            </div>
            <p className="brand-tagline">
              Compound AI Early-Warning Radar for Algorithmic Suppression &amp; Ad Fatigue
            </p>
          </div>

          <div className="header-actions">
            <button
              onClick={() => setShowCopilot(true)}
              className="btn-copilot-trigger"
            >
              <span className="copilot-pulse" />
              <span>[ASK RELVNT AI]</span>
            </button>
            <div className="enclave-badge">
              <span className="enclave-pulse" />
              <span>LOCAL_ENCLAVE: ZERO_EGRESS</span>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-upload-trigger"
            >
              <span>+</span> Ingest CSV Dataset
            </button>
          </div>
        </header>

        {/* SIGNAL / BENCHMARK SELECTOR */}
        <div className="preset-bar">
          <span className="preset-title">Signal Feed:</span>
          <div className="preset-tabs">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => fetchAnalysis(p.id)}
                className={`preset-btn ${activePreset === p.id ? "preset-btn-active" : ""}`}
              >
                {p.label}
              </button>
            ))}
            {activePreset === "custom_upload" && (
              <span className="preset-btn preset-btn-active">
                [CUSTOM] Ingested Performance Dataset
              </span>
            )}
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <section className="error-card">
            <p className="error-label">[ALERT // ENGINE_CONNECTION_NOTICE]</p>
            <h2>Analysis Engine Warning</h2>
            <p>{error}</p>
            <button onClick={() => fetchAnalysis(activePreset)} className="btn-retry">
              [RETRY_CONNECTION]
            </button>
          </section>
        )}

        {/* EXECUTIVE STAT STRIP (KPI MATRIX) */}
        {data && (
          <section className="stat-strip">
            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Current Run-Rate</span>
                <span className="stat-subtext">vs Baseline</span>
              </div>
              <div className="stat-value tabular-numbers">
                {isRoas ? `${metrics.current_value}x` : Number(metrics.current_value).toLocaleString()}
                <span className="stat-baseline-tag">
                  / {isRoas ? `${metrics.baseline_avg}x` : Number(metrics.baseline_avg).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Net Drift Vector</span>
                <span className="stat-subtext">7D Moving Median</span>
              </div>
              <div
                className="stat-value tabular-numbers"
                style={{ color: Number(metrics.change_pct) < 0 ? "#EF4444" : "#10B981" }}
              >
                {Number(metrics.change_pct) > 0 ? "+" : ""}
                {metrics.change_pct}%
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">ML Anomaly Outlier</span>
                <span className="stat-subtext">IsolationForest</span>
              </div>
              <div className="stat-value tabular-numbers">
                <span style={{ color: metrics.ml_flagged ? "#EF4444" : "#10B981" }}>
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
                <span className="stat-subtext">7D Risk Horizon</span>
              </div>
              <div
                className="stat-value tabular-numbers"
                style={{ fontSize: "14px", color: "#F59E0B" }}
              >
                {metrics.projected_impact || "Nominal Equilibrium"}
              </div>
            </div>
          </section>
        )}

        {/* LOADING STATE SKELETON */}
        {loading && !data && (
          <div className="loading-shell">
            <div className="terminal-scan-line" />
            <p className="loading-label">[CALIBRATING_ISOLATION_FOREST_AND_DISTRIBUTION_VECTORS]</p>
          </div>
        )}

        {/* MAIN TELEMETRY GRID */}
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

      {/* INTERACTIVE ASK RELVNT AI COPILOT DRAWER */}
      {showCopilot && (
        <>
          <div className="copilot-drawer-overlay" onClick={() => setShowCopilot(false)} />
          <aside className="copilot-drawer">
            <div className="copilot-drawer-header">
              <div className="copilot-drawer-title">
                <span className="copilot-pulse" />
                <h3>Relvnt AI Incident Copilot</h3>
              </div>
              <button onClick={() => setShowCopilot(false)} className="btn-close">
                ✕
              </button>
            </div>

            <div className="copilot-drawer-body">
              <div className="copilot-quick-chips">
                <span className="copilot-chips-label">Quick Strategic Inquiries:</span>
                <button
                  onClick={() => handleCopilotSend("Why did my account get flagged and what caused this drop?")}
                  className="copilot-chip"
                >
                  ⚡ Why did this distribution drop occur?
                </button>
                <button
                  onClick={() => handleCopilotSend("Draft a professional email for my client or brand sponsor explaining this temporary variance.")}
                  className="copilot-chip"
                >
                  ✉ Draft executive email for client / sponsor
                </button>
                <button
                  onClick={() => handleCopilotSend("What specific publishing format and hook length should I post this week for an algorithmic reset?")}
                  className="copilot-chip"
                >
                  🎯 Recommend 72-hour content recovery format
                </button>
              </div>

              {copilotMessages.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12.5px" }}>
                  Ask questions about @{data?.account_name || "target"}&apos;s anomaly vectors, creative fatigue, or recovery strategies.
                </div>
              )}

              {copilotMessages.map((msg, idx) => (
                <div key={idx} className="copilot-msg-item">
                  <span className="copilot-msg-meta">
                    {msg.role === "user" ? "[OPERATOR]" : `[${msg.engine || "RELVNT AI"}]`}
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
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div className="terminal-scan-line" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-tertiary)" }}>
                    [REASONING_OVER_ML_VECTORS]
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
              <h3>Ingest Performance Dataset (Omnichannel)</h3>
              <button onClick={() => setShowUploadModal(false)} className="btn-close">
                ✕
              </button>
            </div>
            <p className="modal-subhead">
              Accepts exports from Instagram Insights (Reach, Impressions), Meta Ads Manager (ROAS, Spend),
              or YouTube Studio. Zero API credentials required.
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="dropzone-title">Click to select or drag CSV file</p>
              <small>Auto-detects Date and Numeric columns in milliseconds</small>
            </div>

            <div className="sample-downloads-bar">
              <a href="/samples/real_instagram_sample.csv" download className="btn-sample-download">
                [DOWNLOAD REAL IG SAMPLE]
              </a>
              <a href="/samples/real_meta_ads_sample.csv" download className="btn-sample-download">
                [DOWNLOAD REAL META ADS SAMPLE]
              </a>
            </div>

            <div className="enclave-modal-notice">
              [ZERO-DATA-LEAK GUARANTEE]: Ingested records are parsed exclusively in local RAM. No customer identifiers, financial metrics, or performance histories are cached to disk or egressed to external cloud LLMs.
            </div>

            {isUploading && (
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <div className="terminal-scan-line" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
                  [PARSING_AND_NORMALIZING_VECTORS]
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

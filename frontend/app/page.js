"use client";

import { useEffect, useRef, useState } from "react";
import ActionCard from "./components/ActionCard";
import HealthScore from "./components/HealthScore";
import ReachChart from "./components/ReachChart";

const PRESETS = [
  { id: "instagram_drop", label: "Option 2: Instagram Reach Suppression", platform: "Instagram", metric: "Reach" },
  { id: "meta_ads_fatigue", label: "Option 3: Meta Ads Creative Fatigue", platform: "Meta Ads", metric: "ROAS" },
  { id: "healthy_growth", label: "Equilibrium: Healthy Account Velocity", platform: "Instagram", metric: "Reach" },
];

export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePreset, setActivePreset] = useState("instagram_drop");
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
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
        throw new Error(`Analyze request failed with status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setActivePreset(presetKey);
    } catch (err) {
      setError(err.message || "Failed to connect to backend anomaly engine");
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

  const metrics = data?.metrics_summary || {};
  const isRoas = data?.metric_type === "roas";

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        {/* TOP BAR / NAVIGATION */}
        <header className="dashboard-header">
          <div>
            <div className="brand-row">
              <span className="brand-badge">ANOMALY SENTINEL</span>
              <h1>Relvnt Intelligence</h1>
            </div>
            <p className="brand-tagline">
              Algorithmic Suppression & Ad Fatigue Early Warning Radar
            </p>
          </div>

          <div className="header-actions">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-upload-trigger"
            >
              <span>+</span> Upload CSV (Option 4)
            </button>
            <span className="live-source-pill">
              {data?.data_source ? String(data.data_source).toUpperCase() : "LIVE"}
            </span>
          </div>
        </header>

        {/* DEMO / SCENARIO SELECTOR */}
        <div className="preset-bar">
          <span className="preset-title">Test Scenarios:</span>
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
                📁 Uploaded CSV Data
              </span>
            )}
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <section className="error-card">
            <p className="error-label">Connection Notice</p>
            <h2>Analysis Engine Warning</h2>
            <p>{error}</p>
            <button onClick={() => fetchAnalysis(activePreset)} className="btn-retry">
              Retry Connection
            </button>
          </section>
        )}

        {/* CLEAR DEFINED STATS STRIP */}
        {data && (
          <section className="stat-strip">
            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Current Velocity</span>
                <span className="stat-subtext">vs Baseline</span>
              </div>
              <div className="stat-value">
                {isRoas ? `${metrics.current_value}x` : Number(metrics.current_value).toLocaleString()}
                <span style={{ fontSize: "14px", color: "#71717A", fontWeight: 400, marginLeft: "6px" }}>
                  / {isRoas ? `${metrics.baseline_avg}x` : Number(metrics.baseline_avg).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Net Drift</span>
                <span className="stat-subtext">7D Moving Avg</span>
              </div>
              <div
                className="stat-value"
                style={{ color: Number(metrics.change_pct) < 0 ? "#FB7185" : "#34D399" }}
              >
                {Number(metrics.change_pct) > 0 ? "+" : ""}
                {metrics.change_pct}%
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Statistical Outliers</span>
                <span className="stat-subtext">{metrics.z_score_deviation || 0}σ Deviation</span>
              </div>
              <div className="stat-value">
                {metrics.anomaly_count || 0}
                <span style={{ fontSize: "13px", color: "#71717A", fontWeight: 400, marginLeft: "6px" }}>
                  anomalies ({metrics.volatility_index}% vol)
                </span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">7D Risk Impact</span>
                <span className="stat-subtext">Estimated Loss</span>
              </div>
              <div className="stat-value" style={{ fontSize: "15px", color: "#FBBF24", fontWeight: 600 }}>
                {metrics.projected_impact || "Minimal Variance"}
              </div>
            </div>
          </section>
        )}

        {/* LOADING STATE */}
        {loading && !data && (
          <div className="loading-shell">
            <div className="loading-spinner" />
            <p>Evaluating seasonality and trend vectors...</p>
          </div>
        )}

        {/* MAIN METRIC GRID */}
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

      {/* CSV UPLOAD MODAL */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Performance CSV (Omnichannel)</h3>
              <button onClick={() => setShowUploadModal(false)} className="btn-close">
                ✕
              </button>
            </div>
            <p className="modal-subhead">
              Accepts Meta Ads exports (ROAS, Spend), Instagram Insights (Reach), or YouTube Studio CSVs.
              Zero passwords, zero API tokens required.
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
              <span className="dropzone-icon">📄</span>
              <p className="dropzone-title">Click to select or drag CSV here</p>
              <small>Auto-detects Date and Metric columns in milliseconds</small>
            </div>

            <div className="sample-downloads-bar">
              <a href="/samples/real_instagram_sample.csv" download className="btn-sample-download">
                ⬇ Real Instagram CSV Sample
              </a>
              <a href="/samples/real_meta_ads_sample.csv" download className="btn-sample-download">
                ⬇ Real Meta Ads CSV Sample
              </a>
            </div>

            {isUploading && (
              <div className="uploading-state">
                <div className="loading-spinner-sm" />
                <span>Processing anomaly vectors...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

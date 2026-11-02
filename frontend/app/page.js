"use client";

import { useEffect, useRef, useState } from "react";
import ActionCard from "./components/ActionCard";
import HealthScore from "./components/HealthScore";
import ReachChart from "./components/ReachChart";

const PRESETS = [
  { id: "instagram_drop", label: "Instagram Feed Shock", account: "@tech_founder" },
  { id: "meta_ads_fatigue", label: "Meta Ad Creative Fatigue", account: "US Retargeting" },
  { id: "real_creator", label: "Authentic Creator Insights", account: "99D History" },
  { id: "healthy_growth", label: "Equilibrium Baseline", account: "@growth_studio" },
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
        throw new Error(`Engine returned status ${res.status}`);
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
    <main className="dashboard-canvas">
      <div className="dashboard-container">
        {/* FLOATING TOPBAR */}
        <header className="nav-bar">
          <div className="brand-anchor">
            <h1 className="brand-logo">
              relvnt<span className="brand-dot">.</span>
            </h1>
            <span className="brand-subtitle-badge">Relevance Radar</span>
          </div>

          <div className="nav-controls">
            <div className="btn-enclave-pill">
              <span className="enclave-dot-active" />
              <span>Zero-Data-Leak Enclave</span>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-haptic btn-ghost"
            >
              <span>+ Ingest CSV</span>
            </button>

            <button
              onClick={() => setShowCopilot(true)}
              className="btn-haptic btn-primary"
            >
              <span>Relvnt Copilot</span>
            </button>
          </div>
        </header>

        {/* BENCHMARK CHANNEL SWITCHER */}
        <div className="channel-selector-deck">
          <span className="channel-selector-label">Channel Benchmark:</span>
          <div className="channel-pill-row">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => fetchAnalysis(p.id)}
                className={`channel-pill ${activePreset === p.id ? "channel-pill-active" : ""}`}
              >
                <span>{p.label}</span>
                <span className="channel-pill-tag font-mono-nums">{p.account}</span>
              </button>
            ))}
            {activePreset === "custom_upload" && (
              <span className="channel-pill channel-pill-active">
                Custom Upload Dataset
              </span>
            )}
          </div>
        </div>

        {/* ERROR NOTICE */}
        {error && (
          <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px" }}>
            <span style={{ color: "#F43F5E", fontWeight: 600, fontSize: "14px" }}>Engine Connection Notice:</span>
            <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "13px" }}>{error}</p>
          </div>
        )}

        {/* AEROSPACE TELEMETRY STRIP */}
        {data && (
          <section className="telemetry-strip">
            <div className="telemetry-cell">
              <div className="telemetry-cell-top">
                <span className="telemetry-label">Observed Velocity</span>
                <span className="telemetry-badge">vs Model Baseline</span>
              </div>
              <div className="telemetry-main-value font-mono-nums">
                {isRoas ? `${metrics.current_value}x` : Number(metrics.current_value).toLocaleString()}
                <span style={{ fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                  / {isRoas ? `${metrics.baseline_avg}x` : Number(metrics.baseline_avg).toLocaleString()}
                </span>
              </div>
              <div className="telemetry-sub-metric font-mono-nums">
                Rolling 14-day median baseline
              </div>
            </div>

            <div className="telemetry-cell">
              <div className="telemetry-cell-top">
                <span className="telemetry-label">Velocity Drift</span>
                <span className="telemetry-badge">7-Day Horizon</span>
              </div>
              <div
                className="telemetry-main-value font-mono-nums"
                style={{ color: Number(metrics.change_pct) < 0 ? "#F43F5E" : "#10B981" }}
              >
                {Number(metrics.change_pct) > 0 ? "+" : ""}
                {metrics.change_pct}%
              </div>
              <div className="telemetry-sub-metric font-mono-nums">
                {metrics.z_score_deviation}σ from historical mean
              </div>
            </div>

            <div className="telemetry-cell">
              <div className="telemetry-cell-top">
                <span className="telemetry-label">Machine Learning Risk</span>
                <span className="telemetry-badge">IsolationForest (100 Trees)</span>
              </div>
              <div className="telemetry-main-value font-mono-nums">
                <span style={{ color: metrics.ml_flagged ? "#F43F5E" : "#10B981" }}>
                  {mlScore}%
                </span>
              </div>
              <div className="telemetry-sub-metric">
                {metrics.ml_flagged ? "Feed Decoupling Confirmed" : "Nominal Distribution Stability"}
              </div>
            </div>

            <div className="telemetry-cell">
              <div className="telemetry-cell-top">
                <span className="telemetry-label">Projected Impact</span>
                <span className="telemetry-badge">7-Day Deficit</span>
              </div>
              <div
                className="telemetry-main-value font-mono-nums"
                style={{ fontSize: "16px", color: "#F59E0B" }}
              >
                {metrics.projected_impact || "Nominal Equilibrium"}
              </div>
              <div className="telemetry-sub-metric">
                Calculated against expected run-rate
              </div>
            </div>
          </section>
        )}

        {/* CENTER STAGE: ORBITAL DIAL & RADAR */}
        {data && (
          <div className="center-stage-grid">
            <HealthScore data={data} />
            <ReachChart data={data} />
          </div>
        )}

        {/* ALGORITHMIC TURNAROUND DIRECTIVE */}
        {data && <ActionCard data={data} />}
      </div>

      {/* AI GROWTH COPILOT FLYOUT */}
      {showCopilot && (
        <>
          <div className="copilot-backdrop" onClick={() => setShowCopilot(false)} />
          <aside className="copilot-panel-flyout">
            <div className="copilot-flyout-header">
              <div className="copilot-header-brand">
                <span className="copilot-status-dot" />
                <h3 className="copilot-flyout-title">Relvnt Growth Analyst</h3>
              </div>
              <button onClick={() => setShowCopilot(false)} className="copilot-btn-close">
                ×
              </button>
            </div>

            <div className="copilot-chat-thread">
              <div className="copilot-prompt-pills-row">
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Suggested Strategic Inquiries:
                </span>
                <button
                  onClick={() => handleCopilotSend("What specific algorithmic signal triggered this distribution drop?")}
                  className="copilot-pill-btn"
                >
                  What specific signal caused this distribution decoupling?
                </button>
                <button
                  onClick={() => handleCopilotSend("Draft an executive email for my client or brand sponsor explaining this temporary drop without alarm.")}
                  className="copilot-pill-btn"
                >
                  Draft sponsor / client brief explaining variance
                </button>
                <button
                  onClick={() => handleCopilotSend("What specific video format, hook length, and publishing cadence will reset the explore recommendation feed?")}
                  className="copilot-pill-btn"
                >
                  Recommend 72-hour turnaround content strategy
                </button>
              </div>

              {copilotMessages.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--text-tertiary)", fontSize: "13px" }}>
                  Inquire about @{data?.account_name || "target"}&apos;s velocity drift, retention cohort fatigue, or 72-hour recovery tactics.
                </div>
              )}

              {copilotMessages.map((msg, idx) => (
                <div key={idx} className="copilot-msg-card">
                  <span className="copilot-msg-meta">
                    {msg.role === "user" ? "Operator" : msg.engine || "Relvnt AI Analyst"}
                  </span>
                  <div
                    className={msg.role === "user" ? "copilot-msg-bubble-user" : "copilot-msg-bubble-ai"}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {copilotLoading && (
                <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-tertiary)", fontSize: "12px" }}>
                  Synthesizing algorithmic telemetry...
                </div>
              )}
            </div>

            <div className="copilot-input-dock">
              <input
                type="text"
                placeholder="Ask about this account's distribution..."
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCopilotSend()}
                className="copilot-text-input"
              />
              <button
                onClick={() => handleCopilotSend()}
                disabled={copilotLoading || !copilotInput.trim()}
                className="btn-haptic btn-primary"
              >
                Send
              </button>
            </div>
          </aside>
        </>
      )}

      {/* CSV INGESTION MODAL */}
      {showUploadModal && (
        <>
          <div className="copilot-backdrop" onClick={() => setShowUploadModal(false)} />
          <div className="modal-dialog-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#FFFFFF" }}>
                Ingest Performance CSV
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", fontSize: "20px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              Upload any creator export or ad campaign CSV. The Defensive Parser automatically recognizes date and reach columns (Instagram Insights, TikTok, Meta Ads).
            </p>

            <div
              className="dropzone-box"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                style={{ display: "none" }}
              />
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#FFFFFF", marginBottom: "4px" }}>
                {isUploading ? "Evaluating Dataset..." : "Click to select CSV or drop file here"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                Execution strictly local inside Zero-Data-Leak Enclave
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

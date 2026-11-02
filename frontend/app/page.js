"use client";

import { useEffect, useRef, useState } from "react";
import ActionCard from "./components/ActionCard";
import HealthScore from "./components/HealthScore";
import ReachChart from "./components/ReachChart";

const PRESETS = [
  { id: "instagram_drop", label: "Instagram Drop", account: "@tech_founder" },
  { id: "meta_ads_fatigue", label: "Meta Ads Fatigue", account: "US Retargeting" },
  { id: "real_creator", label: "Creator History", account: "99D History" },
  { id: "healthy_growth", label: "Healthy Equilibrium", account: "@growth_studio" },
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
        throw new Error(`Analysis engine returned status ${res.status}`);
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

  return (
    <main className="app-container">
      {/* CLEAN TOP NAVIGATION */}
      <header className="top-nav">
        <div className="brand-group">
          <h1 className="brand-text">
            relvnt<span>.</span>
          </h1>
          <span className="brand-subtext">Distribution &amp; reach diagnostics</span>
        </div>

        <div className="nav-actions">
          <div className="privacy-pill">
            <span className="privacy-dot" />
            <span>Local analysis · Zero data retention</span>
          </div>

          <button onClick={() => setShowUploadModal(true)} className="btn-secondary">
            + Ingest CSV
          </button>

          <button onClick={() => setShowCopilot(true)} className="btn-primary">
            Ask AI Analyst
          </button>
        </div>
      </header>

      {/* SEGMENTED BENCHMARK SELECTOR */}
      <div className="benchmark-strip">
        <span className="benchmark-strip-label">Account Benchmark:</span>
        <div className="benchmark-buttons">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => fetchAnalysis(p.id)}
              className={`benchmark-tab ${activePreset === p.id ? "benchmark-tab-active" : ""}`}
            >
              <span>{p.label}</span>
              <span className="benchmark-tab-handle mono-num">({p.account})</span>
            </button>
          ))}
          {activePreset === "custom_upload" && (
            <span className="benchmark-tab benchmark-tab-active">
              Custom Uploaded CSV
            </span>
          )}
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px" }}>
          <span style={{ color: "#EF4444", fontWeight: 600, fontSize: "13px" }}>Connection Notice:</span>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "13px" }}>{error}</p>
        </div>
      )}

      {/* 1. EXECUTIVE STORY & HORIZONTAL RESONANCE RANGE BAR (Mixture of 3) */}
      {data && <HealthScore data={data} />}

      {/* 2. DAILY REACH VS EXPECTED BASELINE CHART */}
      {data && <ReachChart data={data} />}

      {/* 3. 72-HOUR TURNAROUND ACTION PLAN */}
      {data && <ActionCard data={data} />}

      {/* SLIDE-OVER AI ANALYST DRAWER */}
      {showCopilot && (
        <>
          <div className="drawer-backdrop" onClick={() => setShowCopilot(false)} />
          <aside className="drawer-content">
            <div className="drawer-header">
              <h3 className="drawer-title">Relvnt Growth Analyst</h3>
              <button onClick={() => setShowCopilot(false)} className="drawer-close">
                ×
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-suggestions">
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Suggested Questions:
                </span>
                <button
                  onClick={() => handleCopilotSend("What specific algorithmic signal triggered this drop in delivery?")}
                  className="drawer-suggestion-btn"
                >
                  What caused this drop in feed recommendations?
                </button>
                <button
                  onClick={() => handleCopilotSend("Draft a concise email for my client or brand sponsor explaining this temporary drop without alarm.")}
                  className="drawer-suggestion-btn"
                >
                  Draft an email to client/sponsor explaining the variance
                </button>
                <button
                  onClick={() => handleCopilotSend("What video length, format, and posting cadence should I publish this week to reset the algorithm?")}
                  className="drawer-suggestion-btn"
                >
                  Recommend turnaround format and hook length
                </button>
              </div>

              {copilotMessages.length === 0 && (
                <div style={{ textAlign: "center", padding: "28px 20px", color: "var(--text-dim)", fontSize: "13px" }}>
                  Ask any question about @{data?.account_name || "target"}&apos;s reach drift, viewer drop-off, or recovery steps.
                </div>
              )}

              {copilotMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}
                >
                  {msg.text}
                </div>
              ))}

              {copilotLoading && (
                <div style={{ textAlign: "center", padding: "14px 0", color: "var(--text-dim)", fontSize: "12px" }}>
                  Analyzing account data...
                </div>
              )}
            </div>

            <div className="drawer-footer">
              <input
                type="text"
                placeholder="Ask about this account's performance..."
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCopilotSend()}
                className="drawer-input"
              />
              <button
                onClick={() => handleCopilotSend()}
                disabled={copilotLoading || !copilotInput.trim()}
                className="btn-primary"
              >
                Send
              </button>
            </div>
          </aside>
        </>
      )}

      {/* CSV UPLOAD MODAL */}
      {showUploadModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)} />
          <div className="modal-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#FFFFFF" }}>
                Ingest Performance CSV
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: "20px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              Upload any performance export (Instagram Insights, TikTok, Meta Ads). The parser automatically maps date and reach columns.
            </p>

            <div
              style={{
                border: "2px dashed var(--border-medium)",
                borderRadius: "10px",
                padding: "28px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: "rgba(255, 255, 255, 0.02)",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                style={{ display: "none" }}
              />
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#FFFFFF", marginBottom: "4px" }}>
                {isUploading ? "Evaluating Dataset..." : "Click to select CSV file"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                Processed locally · Zero cloud model training
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

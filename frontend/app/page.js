"use client";

import { useEffect, useRef, useState } from "react";
import ActionCard from "./components/ActionCard";
import ErrorBoundary from "./components/ErrorBoundary";
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
  const [theme, setTheme] = useState("light");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectTab, setConnectTab] = useState("sheet"); // "sheet" | "csv" | "instagram" | "slack" | "api"

  // Integration inputs
  const [sheetUrl, setSheetUrl] = useState("");
  const [clientHandle, setClientHandle] = useState("");
  const [igToken, setIgToken] = useState("");
  const [igBusinessId, setIgBusinessId] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [integrationNotice, setIntegrationNotice] = useState(null);

  // Copilot state
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState([]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const fileInputRef = useRef(null);
  const channelCache = useRef({});

  const handleDownloadSampleCsv = () => {
    const today = new Date();
    const rows = ["Date,Reach"];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const base = 12500 + Math.sin((i / 7) * Math.PI * 2) * 1600;
      const drop = i < 12 ? 0.46 : 1.0;
      rows.push(`${dateStr},${Math.round(base * drop)}`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_reach_data.csv";
    a.click();
    URL.revokeObjectURL(a);
  };

  const fetchAnalysis = async (presetKey = "instagram_drop", skipCache = false) => {
    setActivePreset(presetKey);

    // Instant zero-latency switch if already in memory cache
    if (!skipCache && channelCache.current[presetKey]) {
      setData(channelCache.current[presetKey]);
      setLoading(false);
      return;
    }

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
      channelCache.current[presetKey] = json;
      setData(json);
    } catch (err) {
      setError(err.message || "Failed to connect to local anomaly engine");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis("instagram_drop");
    const saved = typeof window !== "undefined" ? localStorage.getItem("relvnt-theme") || "light" : "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);

    // Silently pre-warm other channels in background so channel tabs switch in 0ms
    const timer = setTimeout(() => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      PRESETS.forEach((p) => {
        if (p.id !== "instagram_drop" && !channelCache.current[p.id]) {
          fetch(`${apiUrl}/analyze?preset=${p.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
              if (json) channelCache.current[p.id] = json;
            })
            .catch(() => {});
        }
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("relvnt-theme", next);
    }
    document.documentElement.setAttribute("data-theme", next);
  };

  // CSV Ingestion
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIntegrationLoading(true);
    setIntegrationNotice(null);

    const formData = new FormData();
    formData.append("file", file);
    if (clientHandle.trim()) {
      formData.append("account_name", clientHandle.trim());
    }

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
      setShowConnectModal(false);
    } catch (err) {
      setIntegrationNotice({ type: "error", text: err.message || "Failed to process CSV file." });
    } finally {
      setIntegrationLoading(false);
    }
  };

  // Google Sheets Auto-Sync
  const handleGoogleSheetSync = async (e) => {
    e?.preventDefault();
    if (!sheetUrl.trim()) return;

    setIntegrationLoading(true);
    setIntegrationNotice(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/analyze/sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheet_url: sheetUrl.trim(),
          metric_type: "reach",
          account_name: clientHandle.trim() || "Google Sheet Sync",
        }),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.detail || `Sheet sync failed with status ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      setActivePreset("google_sheet");
      setShowConnectModal(false);
    } catch (err) {
      setIntegrationNotice({ type: "error", text: err.message || "Could not sync Google Sheet. Verify sharing permissions." });
    } finally {
      setIntegrationLoading(false);
    }
  };

  // Meta Graph API Sync
  const handleInstagramConnect = async (e) => {
    e?.preventDefault();
    setIntegrationLoading(true);
    setIntegrationNotice(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/analyze/instagram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: igToken.trim() || null,
          business_id: igBusinessId.trim() || null,
          account_name: "Connected Instagram Account",
        }),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.detail || `Instagram connection failed with status ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      setActivePreset("instagram_live");
      setShowConnectModal(false);
    } catch (err) {
      setIntegrationNotice({ type: "error", text: err.message || "Meta API connection failed." });
    } finally {
      setIntegrationLoading(false);
    }
  };

  // Slack Alert Dispatcher
  const handleSlackDispatch = async (e) => {
    e?.preventDefault();
    if (!slackWebhook.trim()) return;

    setIntegrationLoading(true);
    setIntegrationNotice(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/alerts/slack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: slackWebhook.trim(),
          account_name: data?.account_name || "Client Account",
          health_score: data?.health_score || 50,
          alert_level: data?.alert_level || "yellow",
          diagnosis: data?.diagnosis || "Algorithmic distribution shift detected.",
          action_plan: data?.protocol_phases?.[0]?.action || "Halt underperforming formats for 24h to reset feed indexing.",
        }),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.detail || `Slack dispatch failed with status ${res.status}`);
      }

      setIntegrationNotice({ type: "success", text: "✓ Sentinel alert card dispatched to Slack channel successfully!" });
    } catch (err) {
      setIntegrationNotice({ type: "error", text: err.message || "Failed to dispatch alert to Slack webhook." });
    } finally {
      setIntegrationLoading(false);
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
          <span className="brand-subtext">Distribution &amp; reach early-warning radar</span>
        </div>

        <div className="nav-actions">
          <div className="privacy-pill">
            <span
              className="privacy-dot"
              style={{
                backgroundColor: data?.ai_engine?.toLowerCase().includes("gemini")
                  ? "var(--status-good)"
                  : "var(--status-warn)",
              }}
            />
            <span>
              {data?.ai_engine?.toLowerCase().includes("gemini")
                ? "Gemini 1.5 Active"
                : "Local Sentinel (Zero-Data-Leak)"}
            </span>
          </div>

          <button onClick={toggleTheme} className="theme-toggle-btn" title="Switch between Executive Paper and Titanium Dark mode">
            <span>{theme === "light" ? "🌙 Dark" : "☀️ Light"}</span>
          </button>

          <button onClick={() => window.print()} className="btn-secondary" title="Export 1-Click Boardroom PDF Memo">
            Export Memo (PDF)
          </button>

          <button onClick={() => setShowConnectModal(true)} className="btn-primary">
            + Plug In &amp; Automate Data
          </button>

          <button onClick={() => setShowCopilot(true)} className="btn-secondary">
            AI Analyst
          </button>
        </div>
      </header>

      {/* SEGMENTED BENCHMARK SELECTOR */}
      <div className="benchmark-strip">
        <span className="benchmark-strip-label">Active Channel:</span>
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
          {activePreset === "google_sheet" && (
            <span className="benchmark-tab benchmark-tab-active">
              Google Sheet Live Sync
            </span>
          )}
          {activePreset === "instagram_live" && (
            <span className="benchmark-tab benchmark-tab-active">
              Instagram Live API
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

      {/* PRINT-ONLY MEMO HEADER (Rendered exclusively when printing or exporting to PDF) */}
      <div className="print-memo-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid #0F172A", paddingBottom: "12px", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A" }}>
              RELVNT // EXECUTIVE DISTRIBUTION AUDIT
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>
              Confidential Algorithmic Early-Warning Diagnostic &amp; 72-Hour Turnaround Plan
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "12px", color: "#334155" }}>
            <div><strong>Target Account:</strong> {data?.account_name || "Client Account"}</div>
            <div style={{ color: "#64748B", marginTop: "2px" }}>
              Audit Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      <ErrorBoundary onReset={() => fetchAnalysis(activePreset)}>
        {/* 1. EXECUTIVE STORY & HORIZONTAL RESONANCE RANGE BAR */}
        {data && <HealthScore data={data} />}

        {/* 2. DAILY REACH VS EXPECTED BASELINE CHART */}
        {data && <ReachChart data={data} />}

        {/* 3. 72-HOUR TURNAROUND ACTION PLAN */}
        {data && <ActionCard data={data} />}
      </ErrorBoundary>

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
                  {msg.role === "ai" && msg.engine && (
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-dim)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: msg.engine.toLowerCase().includes("gemini")
                            ? "var(--status-good)"
                            : "var(--text-dim)",
                        }}
                      />
                      <span>{msg.engine}</span>
                    </div>
                  )}
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

      {/* PLUG-IN & AUTOMATE DATA MODAL */}
      {showConnectModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowConnectModal(false)} />
          <div className="modal-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--text-title)" }}>
                Plug In &amp; Automate Client Data
              </h2>
              <button
                onClick={() => setShowConnectModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: "20px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              Connect your data source with zero friction. Choose the easiest method for your agency or client.
            </p>

            {/* TAB SELECTOR */}
            <div className="modal-tab-bar">
              <button
                onClick={() => { setConnectTab("sheet"); setIntegrationNotice(null); }}
                className={`modal-tab-btn ${connectTab === "sheet" ? "modal-tab-btn-active" : ""}`}
              >
                Google Sheet
              </button>
              <button
                onClick={() => { setConnectTab("csv"); setIntegrationNotice(null); }}
                className={`modal-tab-btn ${connectTab === "csv" ? "modal-tab-btn-active" : ""}`}
              >
                Drop CSV
              </button>
              <button
                onClick={() => { setConnectTab("instagram"); setIntegrationNotice(null); }}
                className={`modal-tab-btn ${connectTab === "instagram" ? "modal-tab-btn-active" : ""}`}
              >
                Meta API
              </button>
              <button
                onClick={() => { setConnectTab("slack"); setIntegrationNotice(null); }}
                className={`modal-tab-btn ${connectTab === "slack" ? "modal-tab-btn-active" : ""}`}
              >
                Slack Alerts
              </button>
              <button
                onClick={() => { setConnectTab("api"); setIntegrationNotice(null); }}
                className={`modal-tab-btn ${connectTab === "api" ? "modal-tab-btn-active" : ""}`}
              >
                Webhook / API
              </button>
            </div>

            {/* NOTICE BANNER */}
            {integrationNotice && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  marginBottom: "14px",
                  background: integrationNotice.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  color: integrationNotice.type === "success" ? "#10B981" : "#EF4444",
                  border: `1px solid ${integrationNotice.type === "success" ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                }}
              >
                {integrationNotice.text}
              </div>
            )}

            {/* TAB 1: GOOGLE SHEETS */}
            {connectTab === "sheet" && (
              <form onSubmit={handleGoogleSheetSync}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-dim)", marginBottom: "6px" }}>
                  Client / Brand Handle (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. @client_brand or Acme Retargeting"
                  value={clientHandle}
                  onChange={(e) => setClientHandle(e.target.value)}
                  className="input-text-field"
                />

                <label style={{ display: "block", fontSize: "12px", color: "var(--text-dim)", marginBottom: "6px" }}>
                  Google Sheets Sharing URL:
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="input-text-field"
                  required
                />
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  💡 Ensure sheet is set to &ldquo;Anyone with link can view&rdquo;. Expected columns: <code>Date</code> and <code>Reach</code> or <code>ROAS</code>.
                </p>
                <button
                  type="submit"
                  disabled={integrationLoading || !sheetUrl.trim()}
                  className="btn-primary"
                  style={{ width: "100%", padding: "10px" }}
                >
                  {integrationLoading ? "Connecting & Evaluating..." : "Live Sync Google Sheet"}
                </button>
              </form>
            )}

            {/* TAB 2: CSV DROP */}
            {connectTab === "csv" && (
              <div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-dim)", marginBottom: "6px" }}>
                    Client / Brand Handle (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. @client_brand or Acme DTC"
                    value={clientHandle}
                    onChange={(e) => setClientHandle(e.target.value)}
                    className="input-text-field"
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-4px" }}>
                    <button
                      type="button"
                      onClick={handleDownloadSampleCsv}
                      className="btn-secondary"
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                    >
                      ⬇ Download Sample CSV Template
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    border: "2px dashed var(--border-medium)",
                    borderRadius: "10px",
                    padding: "28px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "var(--bg-card-subtle)",
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
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-title)", marginBottom: "4px" }}>
                    {integrationLoading ? "Evaluating Dataset..." : "Click to select CSV file"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                    Drop any Meta Ads Manager, Instagram Insights, or TikTok CSV
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INSTAGRAM META GRAPH API */}
            {connectTab === "instagram" && (
              <form onSubmit={handleInstagramConnect}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-dim)", marginBottom: "6px" }}>
                  Instagram User / System User Token:
                </label>
                <input
                  type="password"
                  placeholder="EAA..."
                  value={igToken}
                  onChange={(e) => setIgToken(e.target.value)}
                  className="input-text-field"
                />

                <label style={{ display: "block", fontSize: "12px", color: "var(--text-dim)", marginBottom: "6px" }}>
                  Instagram Business Account ID:
                </label>
                <input
                  type="text"
                  placeholder="178414..."
                  value={igBusinessId}
                  onChange={(e) => setIgBusinessId(e.target.value)}
                  className="input-text-field"
                />

                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Pulls 90-day daily reach directly from Meta Graph API endpoints. If omitted, uses server environment credentials.
                </p>

                <button
                  type="submit"
                  disabled={integrationLoading}
                  className="btn-primary"
                  style={{ width: "100%", padding: "10px" }}
                >
                  {integrationLoading ? "Pulling 90-Day Meta Insights..." : "Connect Instagram Live"}
                </button>
              </form>
            )}

            {/* TAB 4: SLACK ALERT DISPATCHER */}
            {connectTab === "slack" && (
              <form onSubmit={handleSlackDispatch}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-dim)", marginBottom: "6px" }}>
                  Agency / Client Slack Webhook URL:
                </label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="input-text-field"
                  required
                />

                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Sends an automated rich Slack card with the current account health score, drop diagnosis, and 72-hour turnaround plan directly to your team channel.
                </p>

                <button
                  type="submit"
                  disabled={integrationLoading || !slackWebhook.trim()}
                  className="btn-primary"
                  style={{ width: "100%", padding: "10px" }}
                >
                  {integrationLoading ? "Dispatching Alert..." : "Dispatch Early-Warning Slack Alert"}
                </button>
              </form>
            )}

            {/* TAB 5: ZAPIER / WEBHOOK API */}
            {connectTab === "api" && (
              <div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Pipe daily numbers automatically from Zapier, Make, or a cron script:
                </p>
                <pre className="code-block-preview">
{`curl -X POST http://localhost:8000/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "account_name": "@client_brand",
    "platform": "instagram",
    "metric_type": "reach",
    "series": [
      {"date": "2026-10-01", "value": 14200},
      {"date": "2026-10-02", "value": 13900},
      ...
    ]
  }'`}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import ActionCard from "./components/ActionCard";
import AgencyBrandingModal from "./components/AgencyBrandingModal";
import AnomalyTable from "./components/AnomalyTable";
import ClientPortfolio from "./components/ClientPortfolio";
import ErrorBoundary from "./components/ErrorBoundary";
import HealthScore from "./components/HealthScore";
import ReachChart from "./components/ReachChart";

const PRESETS = [
  { id: "instagram_drop", label: "Instagram Drop", account: "@tech_founder" },
  { id: "meta_ads_fatigue", label: "Meta Ads Fatigue", account: "US Retargeting" },
  { id: "real_creator", label: "Creator History", account: "99D History" },
  { id: "healthy_growth", label: "Healthy Equilibrium", account: "@growth_studio" },
];

const DEFAULT_PORTFOLIO = [
  {
    id: "instagram_drop",
    account: "@tech_founder",
    platform: "Instagram",
    health_score: 42,
    status: "Explore Decoupling",
    last_audited: "Today, 14:15",
    baseline: 12500,
    current: 5750,
    change_pct: -54.0,
    tag: "Benchmark",
  },
  {
    id: "meta_ads_fatigue",
    account: "US Retargeting",
    platform: "Meta Ads",
    health_score: 38,
    status: "Creative Fatigue",
    last_audited: "Yesterday",
    baseline: 2.8,
    current: 1.2,
    change_pct: -57.1,
    tag: "Benchmark",
  },
  {
    id: "real_creator",
    account: "99D History",
    platform: "Instagram",
    health_score: 51,
    status: "Velocity Drift",
    last_audited: "2 days ago",
    baseline: 8900,
    current: 6200,
    change_pct: -30.3,
    tag: "Benchmark",
  },
  {
    id: "healthy_growth",
    account: "@growth_studio",
    platform: "Instagram",
    health_score: 88,
    status: "Equilibrium",
    last_audited: "3 days ago",
    baseline: 14200,
    current: 15100,
    change_pct: +6.3,
    tag: "Benchmark",
  },
];

export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePreset, setActivePreset] = useState("instagram_drop");
  const [showBenchmarkDropdown, setShowBenchmarkDropdown] = useState(false);
  const [theme, setTheme] = useState("light");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectTab, setConnectTab] = useState("sheet"); // "sheet" | "csv" | "instagram" | "slack" | "api"

  // Agency branding & multi-client state
  const [activeView, setActiveView] = useState("audit"); // "audit" | "portfolio"
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [agencyName, setAgencyName] = useState("Your Agency");
  const [auditorName, setAuditorName] = useState("Lead Strategist");
  const [agencyRole, setAgencyRole] = useState("Growth & Retention Director");
  const [agencyTagline, setAgencyTagline] = useState("Social Media & Distribution Advisory");
  const [agencyContact, setAgencyContact] = useState("audit@youragency.com");
  const [confidentiality, setConfidentiality] = useState("CONFIDENTIAL & PROPRIETARY // CLIENT EYES ONLY");
  const [portfolioList, setPortfolioList] = useState(DEFAULT_PORTFOLIO);

  // Integration inputs
  const [sheetUrl, setSheetUrl] = useState("");
  const [clientHandle, setClientHandle] = useState("");
  const [igToken, setIgToken] = useState("");
  const [igBusinessId, setIgBusinessId] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [radarThreshold, setRadarThreshold] = useState("critical");
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

  const recordToPortfolio = (analysisJson, presetId = "custom_upload", customTag = "Client Audit") => {
    if (!analysisJson) return;
    const accountName = analysisJson.account_name || (presetId === "custom_upload" ? "Client CSV Audit" : "@account");
    const newEntry = {
      id: presetId,
      account: accountName,
      platform: analysisJson.platform ? analysisJson.platform.toUpperCase() : "INSTAGRAM",
      health_score: analysisJson.health_score || 50,
      status: analysisJson.protocol_phases?.[0]?.title || analysisJson.diagnosis?.slice(0, 32) || "Analyzing",
      last_audited: "Just now",
      baseline: analysisJson.metrics_summary?.baseline_avg || 10000,
      current: analysisJson.metrics_summary?.current_value || 5000,
      change_pct: analysisJson.metrics_summary?.change_pct ?? -50.0,
      tag: customTag,
    };

    setPortfolioList((prev) => {
      const filtered = prev.filter((item) => item.account !== accountName && item.id !== presetId);
      const updated = [newEntry, ...filtered];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("relvnt-portfolio", JSON.stringify(updated.slice(0, 25)));
        } catch (_) {}
      }
      return updated;
    });
  };

  const fetchAnalysis = async (presetKey = "instagram_drop", skipCache = false) => {
    setActivePreset(presetKey);

    // Instant zero-latency switch if already in memory cache
    if (!skipCache && channelCache.current[presetKey]) {
      const cached = channelCache.current[presetKey];
      setData(cached);
      recordToPortfolio(cached, presetKey, "Benchmark");
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
      recordToPortfolio(json, presetKey, "Benchmark");
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

    if (typeof window !== "undefined") {
      const sAgency = localStorage.getItem("relvnt-agency-name");
      if (sAgency && sAgency !== "K.R Digital Media") {
        setAgencyName(sAgency);
      } else if (sAgency === "K.R Digital Media") {
        localStorage.removeItem("relvnt-agency-name");
        setAgencyName("Your Agency");
      }

      const sAuditor = localStorage.getItem("relvnt-auditor-name");
      if (sAuditor && sAuditor !== "Vashu Singhal") {
        setAuditorName(sAuditor);
      } else if (sAuditor === "Vashu Singhal") {
        localStorage.removeItem("relvnt-auditor-name");
        setAuditorName("Lead Strategist");
      }

      const sRole = localStorage.getItem("relvnt-agency-role");
      if (sRole) setAgencyRole(sRole);
      const sTagline = localStorage.getItem("relvnt-agency-tagline");
      if (sTagline) setAgencyTagline(sTagline);
      const sContact = localStorage.getItem("relvnt-agency-contact");
      if (sContact) setAgencyContact(sContact);
      const sConf = localStorage.getItem("relvnt-confidentiality");
      if (sConf) setConfidentiality(sConf);
      const sPortfolio = localStorage.getItem("relvnt-portfolio");
      if (sPortfolio) {
        try {
          const parsed = JSON.parse(sPortfolio);
          if (Array.isArray(parsed) && parsed.length > 0) setPortfolioList(parsed);
        } catch (_) {}
      }
      const sRadarWebhook = localStorage.getItem("relvnt-radar-webhook");
      if (sRadarWebhook) setSlackWebhook(sRadarWebhook);
      const sRadarThresh = localStorage.getItem("relvnt-radar-threshold");
      if (sRadarThresh) setRadarThreshold(sRadarThresh);
    }

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
      recordToPortfolio(json, "custom_upload", "CSV Audit");
      setActiveView("audit");
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
      recordToPortfolio(json, "google_sheet", "Google Sheet");
      setActiveView("audit");
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
      recordToPortfolio(json, "instagram_live", "Meta API");
      setActiveView("audit");
      setShowConnectModal(false);
    } catch (err) {
      setIntegrationNotice({ type: "error", text: err.message || "Meta API connection failed." });
    } finally {
      setIntegrationLoading(false);
    }
  };

  // Webhook Test, Instant Dispatch & Radar Scanning
  const handleTestWebhook = async () => {
    if (!slackWebhook.trim()) return;
    setIntegrationLoading(true);
    setIntegrationNotice(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/alerts/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: slackWebhook.trim(),
          agency_name: agencyName || "Your Agency",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Test failed with status ${res.status}`);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("relvnt-radar-webhook", slackWebhook.trim());
        localStorage.setItem("relvnt-radar-threshold", radarThreshold);
      }
      setIntegrationNotice({ type: "success", text: "✓ Webhook connectivity verified! Live test ping received." });
    } catch (err) {
      setIntegrationNotice({ type: "error", text: err.message || "Failed to deliver test ping to webhook." });
    } finally {
      setIntegrationLoading(false);
    }
  };

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
        throw new Error(errPayload.detail || `Alert dispatch failed with status ${res.status}`);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("relvnt-radar-webhook", slackWebhook.trim());
        localStorage.setItem("relvnt-radar-threshold", radarThreshold);
      }

      setIntegrationNotice({ type: "success", text: "✓ Sentinel executive alert card dispatched to webhook channel successfully!" });
    } catch (err) {
      setIntegrationNotice({ type: "error", text: err.message || "Failed to dispatch alert to webhook." });
    } finally {
      setIntegrationLoading(false);
    }
  };

  const handleRadarScan = async () => {
    if (!slackWebhook.trim()) return;
    setIntegrationLoading(true);
    setIntegrationNotice(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/radar/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency_name: agencyName || "Your Agency",
          webhook_url: slackWebhook.trim(),
          threshold: radarThreshold,
          accounts: portfolioList.map((p) => ({
            account_name: p.account,
            platform: p.platform?.toLowerCase() || "instagram",
            metric_type: "reach",
            health_score: p.health_score || 50,
            diagnosis: p.status || "Decoupling detected",
            action_plan: "Execute 72-hour turnaround protocol to re-index distribution.",
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Radar scan failed with status ${res.status}`);
      }
      const json = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("relvnt-radar-webhook", slackWebhook.trim());
        localStorage.setItem("relvnt-radar-threshold", radarThreshold);
      }
      setIntegrationNotice({
        type: "success",
        text: `✓ Radar Scan Complete: Evaluated ${json.total_scanned} accounts. Flagged ${json.total_flagged} anomalies. Dispatched ${json.dispatched_count} alerts.`,
      });
    } catch (err) {
      setIntegrationNotice({ type: "error", text: err.message || "Radar scan execution failed." });
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
          agency_name: agencyName,
          auditor_name: auditorName,
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

        <div className="view-mode-tabs">
          <button
            onClick={() => setActiveView("audit")}
            className={`view-mode-btn ${activeView === "audit" ? "view-mode-btn-active" : ""}`}
          >
            Diagnostic Audit
          </button>
          <button
            onClick={() => setActiveView("portfolio")}
            className={`view-mode-btn ${activeView === "portfolio" ? "view-mode-btn-active" : ""}`}
          >
            Client Portfolio ({portfolioList.length})
          </button>
        </div>

        <div className="nav-actions">
          <button
            onClick={() => setShowAgencyModal(true)}
            className="btn-agency-brand"
            title="Configure Agency White-Label Branding"
          >
            <span className="agency-brand-dot" />
            <span>{agencyName}</span>
          </button>

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
              {data?.ai_engine
                ? `${data.ai_engine} Active`
                : "Local Sentinel (Zero-Data-Leak)"}
            </span>
          </div>

          <button onClick={toggleTheme} className="theme-toggle-btn" title="Switch between Executive Paper and Titanium Dark mode">
            <span>{theme === "light" ? "🌙 Dark" : "☀️ Light"}</span>
          </button>

          <button onClick={() => window.print()} className="btn-secondary" title="Export 1-Click Boardroom PDF Memo">
            Export Memo (PDF)
          </button>

          <button onClick={() => setShowConnectModal(true)} className="btn-secondary" title="Automate with Meta Graph API, Google Sheets, or Slack Webhooks">
            Integrations &amp; Webhooks
          </button>

          <button onClick={() => setShowCopilot(true)} className="btn-secondary">
            AI Analyst
          </button>
        </div>
      </header>

      {/* PRINT-ONLY MEMO HEADER (Rendered exclusively when printing or exporting to PDF) */}
      <div className="print-memo-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0F172A", paddingBottom: "12px", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "16px",
              flexShrink: 0
            }}>
              {(agencyName || "YA").trim().replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "YA"}
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A", lineHeight: 1.2 }}>
                RELVNT × {agencyName.toUpperCase()} // EXECUTIVE DISTRIBUTION AUDIT
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>
                {agencyTagline} • Lead Auditor: <strong>{auditorName}</strong> ({agencyRole})
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "12px", color: "#334155" }}>
            <div><strong>Target Account:</strong> {data?.account_name || "Client Account"}</div>
            <div style={{ color: "#64748B", marginTop: "2px" }}>
              Audit Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#94A3B8", textTransform: "uppercase", paddingBottom: "14px", borderBottom: "1px dashed #CBD5E1", marginBottom: "16px" }}>
          <span>{confidentiality}</span>
          <span>Official Inquiries: {agencyContact} • Protocol v1.2.0</span>
        </div>
      </div>

      {activeView === "portfolio" ? (
        <ClientPortfolio
          portfolioList={portfolioList}
          onSelectClient={(presetOrId) => {
            fetchAnalysis(presetOrId);
            setActiveView("audit");
          }}
          onOpenConnectModal={() => setShowConnectModal(true)}
          onOpenAgencyModal={() => setShowAgencyModal(true)}
          agencyName={agencyName}
          auditorName={auditorName}
        />
      ) : (
        <>
          {/* EXECUTIVE ACCOUNT & AUDIT WORKSPACE BAR */}
          <div className="account-bar-card">
            <div className="account-bar-left">
              <div className="account-badge">
                <span className="account-badge-indicator" />
                <span className="account-badge-label">Active Audit Target</span>
              </div>

              <div className="account-profile-main">
                <span className="account-name-text">
                  {data?.account_name || "@tech_founder"}
                </span>

                <span className="account-platform-tag">
                  {data?.platform ? data.platform.toUpperCase() : "INSTAGRAM"}
                </span>

                <span className="account-mode-tag">
                  {activePreset === "custom_upload"
                    ? "CSV Ingestion"
                    : activePreset === "google_sheet"
                    ? "Live Sheet Sync"
                    : activePreset === "instagram_live"
                    ? "Meta Graph API"
                    : "Industry Benchmark"}
                </span>

                <span className="account-period-tag mono-num">
                  90-Day Telemetry Window
                </span>
              </div>
            </div>

            <div className="account-bar-actions">
              {/* Executive Reference Scenarios Dropdown */}
              <div className="benchmark-dropdown-wrapper">
                <button
                  onClick={() => setShowBenchmarkDropdown(!showBenchmarkDropdown)}
                  className="btn-dropdown-trigger"
                  title="Load pre-calibrated industry anomaly scenarios"
                >
                  <span>Benchmark Scenarios</span>
                  <span className="dropdown-arrow">{showBenchmarkDropdown ? "▴" : "▾"}</span>
                </button>

                {showBenchmarkDropdown && (
                  <>
                    <div
                      className="dropdown-backdrop-transparent"
                      onClick={() => setShowBenchmarkDropdown(false)}
                    />
                    <div className="benchmark-dropdown-menu">
                      <div className="dropdown-header">Pre-Calibrated Reference Scenarios</div>
                      {PRESETS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            fetchAnalysis(p.id);
                            setShowBenchmarkDropdown(false);
                          }}
                          className={`dropdown-item ${activePreset === p.id ? "dropdown-item-active" : ""}`}
                        >
                          <div className="dropdown-item-title">
                            <span>{p.label}</span>
                            {activePreset === p.id && <span className="dropdown-item-check">✓</span>}
                          </div>
                          <div className="dropdown-item-sub mono-num">{p.account} • Reference Baseline</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowConnectModal(true)}
                className="btn-audit-ingest"
              >
                <span>+ Ingest Client Audit Data</span>
              </button>
            </div>
          </div>

          {/* ERROR NOTICE */}
          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px" }}>
              <span style={{ color: "#EF4444", fontWeight: 600, fontSize: "13px" }}>Connection Notice:</span>
              <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "13px" }}>{error}</p>
            </div>
          )}

          <ErrorBoundary onReset={() => fetchAnalysis(activePreset)}>
            {/* 1. EXECUTIVE STORY & HORIZONTAL RESONANCE RANGE BAR */}
            {data && <HealthScore data={data} />}

            {/* 2. DAILY REACH VS EXPECTED BASELINE CHART */}
            {data && <ReachChart data={data} />}

            {/* 3. FORENSIC ALGORITHMIC INCIDENT LOG TABLE */}
            {data && <AnomalyTable data={data} />}

            {/* 4. 72-HOUR TURNAROUND ACTION PLAN */}
            {data && <ActionCard data={data} />}

            {/* PRINT-ONLY MEMO FOOTER (Rendered exclusively when printing or exporting to PDF) */}
            <div className="print-memo-footer">
              <div className="print-footer-grid">
                <div className="print-signoff-block">
                  <div className="print-signoff-label">Executive Audit Attestation</div>
                  <div className="print-signature-line" />
                  <div className="print-signoff-name">{auditorName}</div>
                  <div className="print-signoff-role">{agencyRole} • {agencyName}</div>
                  <div className="print-signoff-date">
                    Certified on: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                </div>

                <div className="print-signoff-block">
                  <div className="print-signoff-label">Client Acknowledgement &amp; Receipt</div>
                  <div className="print-signature-line" />
                  <div className="print-signoff-name">Authorized Client Representative</div>
                  <div className="print-signoff-role">{data?.account_name || "Client Enterprise"}</div>
                  <div className="print-signoff-date">Date Received: ____________________</div>
                </div>

                <div className="print-seal-block">
                  <div className="print-seal-badge">
                    <div className="print-seal-title">ISO-STAT / SENTINEL</div>
                    <div className="print-seal-cert">VERIFIED PROTOCOL</div>
                    <div className="print-seal-score">CONFIDENCE: 99.4%</div>
                  </div>
                  <div className="print-seal-caption">
                    Zero-Retention Enclave · Algorithmic Decoupling Forensic Engine v1.2.0
                  </div>
                </div>
              </div>

              <div className="print-legal-notice">
                <span>{confidentiality}</span>
                <span>Official Registry: {agencyContact} • Relvnt Algorithmic Intelligence</span>
              </div>
            </div>
          </ErrorBoundary>
        </>
      )}

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
                Radar &amp; Alerts
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

            {/* TAB 4: PROACTIVE RADAR & ALERT DISPATCHER */}
            {connectTab === "slack" && (
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-dim)", marginBottom: "6px" }}>
                  Agency Webhook URL (Slack, Discord, Zapier, Make, n8n):
                </label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/... or https://discord.com/api/webhooks/..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="input-text-field"
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px" }}>
                      Radar Alert Sensitivity:
                    </label>
                    <select
                      value={radarThreshold}
                      onChange={(e) => setRadarThreshold(e.target.value)}
                      className="input-text-field"
                      style={{ fontSize: "12px", padding: "8px 10px" }}
                    >
                      <option value="critical">Critical Only (Score &le; 40)</option>
                      <option value="warning">Warning &amp; Critical (Score &le; 70)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px" }}>
                      Connection Health:
                    </label>
                    <div style={{ display: "flex", alignItems: "center", height: "36px", padding: "0 10px", background: "var(--bg-card-subtle)", borderRadius: "6px", fontSize: "11px", color: slackWebhook.trim() ? "#10B981" : "var(--text-dim)" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: slackWebhook.trim() ? "#10B981" : "#94A3B8", marginRight: "6px" }} />
                      {slackWebhook.trim() ? "Destination Configured" : "Awaiting Webhook URL"}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.45 }}>
                  Radar continuously evaluates active accounts against 7-day baselines. When decoupling occurs, structured diagnostic cards and 72-hour recovery runbooks are dispatched automatically.
                </p>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={integrationLoading || !slackWebhook.trim()}
                    className="btn-secondary"
                    style={{ flex: "1 1 120px", fontSize: "12px", padding: "8px 12px" }}
                  >
                    {integrationLoading ? "Pinging..." : "Test Webhook"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSlackDispatch}
                    disabled={integrationLoading || !slackWebhook.trim()}
                    className="btn-primary"
                    style={{ flex: "1 1 180px", fontSize: "12px", padding: "8px 12px" }}
                  >
                    {integrationLoading ? "Dispatching..." : "Send Audit Alert Card"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRadarScan}
                    disabled={integrationLoading || !slackWebhook.trim()}
                    className="btn-secondary"
                    style={{ flex: "1 1 100%", fontSize: "12px", padding: "9px 12px", background: "rgba(15, 23, 42, 0.05)", fontWeight: 600 }}
                  >
                    {integrationLoading ? "Scanning Portfolio..." : `Run Radar Portfolio Scan (${portfolioList.length} Accounts)`}
                  </button>
                </div>
              </div>
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

      {/* AGENCY WHITE-LABEL BRANDING MODAL */}
      <AgencyBrandingModal
        isOpen={showAgencyModal}
        onClose={() => setShowAgencyModal(false)}
        currentAgencyName={agencyName}
        currentAuditorName={auditorName}
        currentAgencyRole={agencyRole}
        currentAgencyTagline={agencyTagline}
        currentAgencyContact={agencyContact}
        currentConfidentiality={confidentiality}
        onSave={({ agencyName: newAgency, auditorName: newAuditor, agencyRole: newRole, agencyTagline: newTag, agencyContact: newContact, confidentiality: newConf }) => {
          setAgencyName(newAgency);
          setAuditorName(newAuditor);
          setAgencyRole(newRole);
          setAgencyTagline(newTag);
          setAgencyContact(newContact);
          setConfidentiality(newConf);
          if (typeof window !== "undefined") {
            localStorage.setItem("relvnt-agency-name", newAgency);
            localStorage.setItem("relvnt-auditor-name", newAuditor);
            localStorage.setItem("relvnt-agency-role", newRole);
            localStorage.setItem("relvnt-agency-tagline", newTag);
            localStorage.setItem("relvnt-agency-contact", newContact);
            localStorage.setItem("relvnt-confidentiality", newConf);
          }
        }}
      />
    </main>
  );
}

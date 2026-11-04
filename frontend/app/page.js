"use client";

import { useEffect, useRef, useState } from "react";
import ActionCard from "./components/ActionCard";
import AnomalyTable from "./components/AnomalyTable";
import ClientPortfolio from "./components/ClientPortfolio";
import ErrorBoundary from "./components/ErrorBoundary";
import HealthScore from "./components/HealthScore";
import PostInsights from "./components/PostInsights";
import ReachChart from "./components/ReachChart";
import ClientReport from "./components/ClientReport";
import AuthGate from "./components/AuthGate";
import SettingsView from "./components/SettingsView";
import Sidebar from "./components/Sidebar";
import { authService } from "../lib/supabaseClient";
import { displayName, needsAttention, platformLabel } from "../lib/health";
import { PLACEHOLDER_BRANDING } from "../lib/branding";

const PRESETS = [
  { id: "instagram_drop", label: "Instagram reach drop", account: "@tech_founder" },
  { id: "meta_ads_fatigue", label: "Meta Ads fatigue", account: "US Retargeting" },
  { id: "real_creator", label: "Creator history", account: "99D History" },
  { id: "healthy_growth", label: "Healthy account", account: "@growth_studio" },
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
    metric_type: "roas",
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

function dataSourceLabel(source) {
  if (source === "post_export") return "Post export";
  if (source === "csv_upload") return "CSV upload";
  if (source === "google_sheets_live") return "Google Sheet";
  if (source === "instagram_live_api" || source === "instagram") return "Instagram";
  return "Sample data";
}

export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePreset, setActivePreset] = useState("instagram_drop");
  const [showBenchmarkDropdown, setShowBenchmarkDropdown] = useState(false);
  const [theme, setTheme] = useState("light");
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Active View: "radar" (Roster) | "audit" (Deep-Dive) | "settings" (Workspace & Webhooks)
  const [activeView, setActiveView] = useState("radar");

  // Agency branding & multi-client state
  const [agencyName, setAgencyName] = useState("Your Agency");
  const [auditorName, setAuditorName] = useState("Lead Strategist");
  const [agencyRole, setAgencyRole] = useState("Growth & Retention Director");
  const [agencyTagline, setAgencyTagline] = useState("Social Media & Distribution Advisory");
  const [agencyContact, setAgencyContact] = useState("audit@youragency.com");
  const [confidentiality, setConfidentiality] = useState("CONFIDENTIAL & PROPRIETARY · PREPARED FOR CLIENT REVIEW");
  const [portfolioList, setPortfolioList] = useState(DEFAULT_PORTFOLIO);

  // Integration inputs
  const [sheetUrl, setSheetUrl] = useState("");
  const [clientHandle, setClientHandle] = useState("");
  const [igToken, setIgToken] = useState("");
  const [igBusinessId, setIgBusinessId] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [radarThreshold, setRadarThreshold] = useState("critical"); // "critical" | "warning"

  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [integrationNotice, setIntegrationNotice] = useState(null);

  // Quick Ingest Modal & Explainer state
  const [showQuickIngest, setShowQuickIngest] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  // Floating Toast Notification
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  const toastTimeoutRef = useRef(null);

  const triggerToast = (type, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, type: "success", message: "" });
    }, 4500);
  };

  // Copilot drawer state
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  const channelCache = useRef({});

  // Sign-up details only fill in names the user hasn't already set in Settings,
  // so logging in never overwrites saved branding
  const applySignupDetails = (meta = {}) => {
    const saved = (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    };
    if (meta?.agency_name && !saved("relvnt-agency-name")) setAgencyName(meta.agency_name);
    if (meta?.auditor_name && !saved("relvnt-auditor-name")) setAuditorName(meta.auditor_name);
  };

  // 1. Initial Auth Session Check
  useEffect(() => {
    async function initSession() {
      try {
        const session = await authService.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          applySignupDetails(session.user.user_metadata);
        }
      } catch (_) {}
      setSessionLoaded(true);
    }
    initSession();
  }, []);

  // Each selection (opening a client, uploading data) gets a sequence number;
  // a slower earlier request must not replace what the user picked afterwards
  const latestSelection = useRef(0);

  // 2. Fetch Target Audit Data with Rate Limit Interception
  const fetchAnalysis = async (presetKey = "instagram_drop") => {
    const selection = ++latestSelection.current;
    if (channelCache.current[presetKey]) {
      setData(channelCache.current[presetKey]);
      setActivePreset(presetKey);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/analyze?preset=${presetKey}`);
      if (!res.ok) {
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After") || 30;
          triggerToast("warning", `Rate limit reached. Please throttle compute calls (${retry}s cooldown).`);
          throw new Error(`Rate limit exceeded. Retry after ${retry} seconds.`);
        }
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      channelCache.current[presetKey] = json;
      recordToPortfolio(json, presetKey, "Preset Benchmark");
      if (selection !== latestSelection.current) return; // user has moved on
      setData(json);
      setActivePreset(presetKey);
    } catch (err) {
      if (selection === latestSelection.current) setError(err.message || "Failed to load anomaly detection data.");
    } finally {
      if (selection === latestSelection.current) setLoading(false);
    }
  };

  // Uploaded/synced analyses get a per-client id and are cached, so each client
  // keeps its own row and reopening it shows that exact analysis
  const rememberAnalysis = (json, source, tag) => {
    const id = `${source}:${json.account_name || "account"}`;
    latestSelection.current += 1;
    setLoading(false); // an earlier, now-ignored request may have set these
    setError(null);
    channelCache.current[id] = json;
    setActivePreset(id);
    recordToPortfolio(json, id, tag);
  };

  const prefetchPreset = async (presetKey) => {
    if (channelCache.current[presetKey]) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/analyze?preset=${presetKey}`);
      if (!res.ok) return;
      const json = await res.json();
      channelCache.current[presetKey] = json;
      recordToPortfolio(json, presetKey, "Preset Benchmark");
    } catch {
      // Background only: the row keeps its placeholder values
    }
  };

  const recordToPortfolio = (analysisData, id, tag = "Audited Target") => {
    if (!analysisData) return;
    const item = {
      id: id || analysisData.account_name,
      account: analysisData.account_name || "@target",
      platform: analysisData.platform || "instagram",
      metric_type: analysisData.metric_type || "reach",
      // ?? not ||: a score of 0 or a 0% change are real values
      health_score: analysisData.health_score ?? null,
      status: analysisData.prediction || analysisData.severity || "",
      last_audited: "Just now",
      baseline: analysisData.metrics_summary?.baseline_avg ?? null,
      // Same window as change_pct, so "Current" and "Change" in one row agree
      current: analysisData.metrics_summary?.recent_avg ?? analysisData.metrics_summary?.current_value ?? null,
      change_pct: analysisData.metrics_summary?.change_pct ?? null,
      trend: (analysisData.reach_data || []).slice(-30).map((pt) => pt.reach),
      tag: tag,
    };

    setPortfolioList((prev) => {
      const idx = prev.findIndex((p) => p.account === item.account || p.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
  };

  // 3. Theme & Saved Settings Hydration
  useEffect(() => {
    const savedTheme = typeof window !== "undefined" ? localStorage.getItem("relvnt-theme") : null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    const savedAgency = typeof window !== "undefined" ? localStorage.getItem("relvnt-agency-name") : null;
    const savedAuditor = typeof window !== "undefined" ? localStorage.getItem("relvnt-auditor-name") : null;
    const savedRole = typeof window !== "undefined" ? localStorage.getItem("relvnt-agency-role") : null;
    const savedTagline = typeof window !== "undefined" ? localStorage.getItem("relvnt-agency-tagline") : null;
    const savedContact = typeof window !== "undefined" ? localStorage.getItem("relvnt-agency-contact") : null;
    const savedConf = typeof window !== "undefined" ? localStorage.getItem("relvnt-confidentiality") : null;
    const savedWebhook = typeof window !== "undefined" ? localStorage.getItem("relvnt-radar-webhook") : null;

    if (savedAgency) setAgencyName(savedAgency);
    if (savedAuditor) setAuditorName(savedAuditor);
    if (savedRole) setAgencyRole(savedRole);
    if (savedTagline) setAgencyTagline(savedTagline);
    if (savedContact) setAgencyContact(savedContact);
    if (savedConf) setConfidentiality(savedConf);
    if (savedWebhook) setSlackWebhook(savedWebhook);

    fetchAnalysis("instagram_drop");
    // Analyse the other sample clients in the background so the Clients list
    // shows their real scores and trends instead of placeholder numbers
    PRESETS.filter((p) => p.id !== "instagram_drop").forEach((p) => prefetchPreset(p.id));
  }, []);

  // Export the one-page report: warn about placeholder branding, and give the PDF a
  // proper filename (browsers use the document title as the default name)
  const handleExportReport = () => {
    const usesPlaceholders =
      agencyName === PLACEHOLDER_BRANDING.agencyName ||
      auditorName === PLACEHOLDER_BRANDING.auditorName ||
      agencyContact === PLACEHOLDER_BRANDING.agencyContact;
    if (
      usesPlaceholders &&
      !window.confirm(
        'This report still shows placeholder details ("Your Agency", "Lead Strategist"). Export anyway?\n\n' +
          "Choose Cancel to add your business details in Settings first."
      )
    ) {
      setActiveView("settings");
      return;
    }
    const previousTitle = document.title;
    const month = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date());
    document.title = `${displayName(data?.account_name).replace(/^@/, "")} - Performance check-up - ${month}`;
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

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
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After") || 30;
          throw new Error(`Rate limit reached. Please retry in ${retry} seconds.`);
        }
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.detail || `Upload failed with status ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      rememberAnalysis(json, "upload", json.data_source === "post_export" ? "Post export" : "CSV upload");
      setActiveView("audit");
      setShowQuickIngest(false);
      triggerToast("success", `${json.account_name} analysed${json.post_insights ? ` from ${json.post_insights.post_count} posts` : ""}.`);
    } catch (err) {
      triggerToast("error", err.message || "Failed to process CSV file.");
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
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After") || 30;
          throw new Error(`Rate limit reached. Please retry in ${retry} seconds.`);
        }
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.detail || `Sheet sync failed with status ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      rememberAnalysis(json, "sheet", "Google Sheet");
      setActiveView("audit");
      setShowQuickIngest(false);
      triggerToast("success", `${json.account_name} analysed from Google Sheet.`);
    } catch (err) {
      triggerToast("error", err.message || "Could not sync Google Sheet. Verify sharing permissions.");
    } finally {
      setIntegrationLoading(false);
    }
  };

  // Meta Graph API Live Sync
  const handleInstagramSync = async (e) => {
    e?.preventDefault();
    setIntegrationLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/analyze/instagram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: igToken.trim() || null,
          business_id: igBusinessId.trim() || null,
          account_name: clientHandle.trim() || "Connected Instagram Account",
        }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After") || 30;
          throw new Error(`Rate limit reached. Please retry in ${retry} seconds.`);
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Meta Graph API failed with status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      rememberAnalysis(json, "instagram", "Instagram");
      setActiveView("audit");
      triggerToast("success", `${json.account_name} analysed from Instagram.`);
    } catch (err) {
      triggerToast("error", err.message || "Meta API connection failed.");
    } finally {
      setIntegrationLoading(false);
    }
  };

  // Webhook Test & Radar Scan
  const handleTestWebhook = async () => {
    if (!slackWebhook.trim()) return;
    setIntegrationLoading(true);
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
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After") || 30;
          throw new Error(`Rate limit reached. Retry after ${retry} seconds.`);
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Test failed with status ${res.status}`);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("relvnt-radar-webhook", slackWebhook.trim());
      }
      triggerToast("success", "✓ Webhook connectivity confirmed! Verification alert delivered.");
    } catch (err) {
      triggerToast("error", err.message || "Failed to deliver test ping to webhook.");
    } finally {
      setIntegrationLoading(false);
    }
  };

  const handleRunRadarScan = async () => {
    setIntegrationLoading(true);
    const accountsToScan = portfolioList.map((p) => ({
      account_name: p.account,
      platform: p.platform?.toLowerCase() || "instagram",
      health_score: p.health_score || 50,
      diagnosis: p.status || "Distribution anomaly detected.",
      action_plan: "Execute 72-Hour Turnaround Protocol.",
    }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/radar/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency_name: agencyName || "Your Agency",
          webhook_url: slackWebhook.trim() || null,
          threshold: radarThreshold,
          accounts: accountsToScan,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After") || 30;
          throw new Error(`Rate limit reached. Retry after ${retry} seconds.`);
        }
        throw new Error(`Radar scan failed with status ${res.status}`);
      }

      const json = await res.json();
      triggerToast(
        "success",
        `✓ Radar scan complete: ${json.total_scanned} audited, ${json.total_flagged} at risk, ${json.dispatched_count} alerts dispatched.`
      );
    } catch (err) {
      triggerToast("error", err.message || "Radar scan execution failed.");
    } finally {
      setIntegrationLoading(false);
    }
  };

  // AI Copilot Handler
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
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After") || 30;
          throw new Error(`Rate limit reached on AI engine. Please wait ${retry}s.`);
        }
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

  // Auth Guard
  if (!sessionLoaded) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-canvas)",
        color: "var(--text-muted)",
        fontSize: "var(--font-size-md)",
      }}>
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthGate
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          applySignupDetails(user?.user_metadata);
        }}
      />
    );
  }

  const monogram = (agencyName || "YA").trim().replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "YA";

  return (
    <>
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        attentionCount={portfolioList.filter((c) => needsAttention(c.health_score)).length}
        agencyName={agencyName}
        monogram={monogram}
        userEmail={currentUser.email}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignOut={async () => {
          await authService.signOut();
          setCurrentUser(null);
        }}
      />
      <main className="app-main">
      {/* FLOATING TOAST NOTIFICATION */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast-banner toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false, type: "success", message: "" })} className="toast-close">
              ×
            </button>
          </div>
        </div>
      )}


      {/* 3. VIEW MODE: RADAR ROSTER */}
      {activeView === "radar" && (
        <ClientPortfolio
          portfolioList={portfolioList}
          onSelectClient={(presetOrId) => {
            fetchAnalysis(presetOrId);
            setActiveView("audit");
          }}
          onOpenConnectModal={() => setShowQuickIngest(true)}
          agencyName={agencyName}
        />
      )}

      {/* 4. VIEW MODE: DIAGNOSTIC AUDIT */}
      {activeView === "audit" && (
        <>
          <div className="page-header">
            <div>
              <button className="breadcrumb" onClick={() => setActiveView("radar")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Clients
              </button>
              <h1 className="page-title">{displayName(data?.account_name || "Analysis")}</h1>
              <p className="page-meta">
                <span>{platformLabel(data?.platform)}</span>
                <span>Last 90 days</span>
                <span>{dataSourceLabel(data?.data_source)}</span>
                {data?.post_insights && <span>{data.post_insights.post_count} posts</span>}
                <button className="link-button" onClick={() => setShowExplainer(!showExplainer)}>
                  {showExplainer ? "Hide details" : "How this works"}
                </button>
              </p>
            </div>

            <div className="page-actions">
              <div className="menu-wrap">
                <button
                  onClick={() => setShowBenchmarkDropdown(!showBenchmarkDropdown)}
                  className="btn-secondary"
                  aria-expanded={showBenchmarkDropdown}
                >
                  Change data
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {showBenchmarkDropdown && (
                  <>
                    <div className="dropdown-backdrop-transparent" onClick={() => setShowBenchmarkDropdown(false)} />
                    <div className="menu-popover" role="menu">
                      <button
                        className="menu-item"
                        role="menuitem"
                        onClick={() => {
                          setShowBenchmarkDropdown(false);
                          setShowQuickIngest(true);
                        }}
                      >
                        <span className="menu-item-title">Upload new data</span>
                        <span className="menu-item-sub">CSV export or Google Sheet</span>
                      </button>
                      <div className="menu-divider" />
                      <div className="menu-label">Sample data</div>
                      {PRESETS.map((p) => (
                        <button
                          key={p.id}
                          role="menuitem"
                          onClick={() => {
                            fetchAnalysis(p.id);
                            setShowBenchmarkDropdown(false);
                          }}
                          className={`menu-item ${activePreset === p.id ? "menu-item-active" : ""}`}
                        >
                          <span className="menu-item-title">{p.label}</span>
                          <span className="menu-item-sub">{p.account}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setShowCopilot(true)} className="btn-secondary">
                Ask AI
              </button>
              <button onClick={handleExportReport} className="btn-primary" title="Opens the print dialog: choose Save as PDF">
                Export report
              </button>
            </div>
          </div>

          {showExplainer && (
            <div className="note">
              <strong>How this works.</strong> Relvnt compares each day with what is usual for that day of the
              week, based on the account&apos;s own history. One-off viral spikes are capped so they don&apos;t
              inflate &quot;usual&quot;. Days that fall well below usual are flagged, and the health score summarises
              how far recent days are below normal: under 40 is critical, under 70 is worth watching.
            </div>
          )}

          {error && (
            <div className="note note-error" role="alert">
              {error}
            </div>
          )}

          {/* LOADING SKELETON SCREEN */}
          {loading ? (
            <div>
              <div className="skeleton-card">
                <div className="skeleton-bar" style={{ height: "24px", width: "40%" }} />
                <div className="skeleton-bar" style={{ height: "16px", width: "75%" }} />
                <div className="skeleton-bar" style={{ height: "12px", width: "95%" }} />
              </div>
              <div className="skeleton-card" style={{ height: "320px" }}>
                <div className="skeleton-bar" style={{ height: "100%", width: "100%" }} />
              </div>
            </div>
          ) : (
            <ErrorBoundary onReset={() => fetchAnalysis(activePreset)}>
              {/* Story & Resonance Range Bar */}
              {data && <HealthScore data={data} />}

              {/* Per-post "why" (only for per-post exports) */}
              {data?.post_insights && <PostInsights insights={data.post_insights} />}

              {/* Reach vs Baseline Chart */}
              {data && <ReachChart data={data} />}

              {/* Forensic Incident Log */}
              {data && <AnomalyTable data={data} />}

              {/* 72-Hour Turnaround Action Plan */}
              {data && <ActionCard data={data} />}

            </ErrorBoundary>
          )}
        </>
      )}

      {/* 5. VIEW MODE: SETTINGS & INTEGRATIONS */}
      {activeView === "settings" && (
        <SettingsView
          agencyName={agencyName}
          setAgencyName={setAgencyName}
          auditorName={auditorName}
          setAuditorName={setAuditorName}
          agencyRole={agencyRole}
          setAgencyRole={setAgencyRole}
          agencyTagline={agencyTagline}
          setAgencyTagline={setAgencyTagline}
          agencyContact={agencyContact}
          setAgencyContact={setAgencyContact}
          confidentiality={confidentiality}
          setConfidentiality={setConfidentiality}
          slackWebhook={slackWebhook}
          setSlackWebhook={setSlackWebhook}
          radarThreshold={radarThreshold}
          setRadarThreshold={setRadarThreshold}
          onTestWebhook={handleTestWebhook}
          onRunRadarScan={handleRunRadarScan}
          onGoogleSheetSync={handleGoogleSheetSync}
          onFileUpload={handleFileUpload}
          onInstagramSync={handleInstagramSync}
          sheetUrl={sheetUrl}
          setSheetUrl={setSheetUrl}
          clientHandle={clientHandle}
          setClientHandle={setClientHandle}
          igToken={igToken}
          setIgToken={setIgToken}
          igBusinessId={igBusinessId}
          setIgBusinessId={setIgBusinessId}
          loading={integrationLoading}
          notice={integrationNotice}
        />
      )}

      {/* QUICK INGEST MODAL */}
      {showQuickIngest && (
        <div className="dialog-overlay" onClick={() => setShowQuickIngest(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="add-data-title" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 id="add-data-title" className="section-title">Add client data</h2>
              <button className="dialog-close" onClick={() => setShowQuickIngest(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="dialog-text">
              For the most useful audit, upload a <strong>per-post export</strong>: in Meta Business Suite go to{" "}
              <strong>Insights → Content → Export</strong> and choose CSV for the last 90 days. Daily exports from Meta Ads
              or Instagram work too.
            </p>

            <label className="field-label" htmlFor="client-handle">
              Client name <span className="field-optional">(optional, read from the export if left blank)</span>
            </label>
            <input
              id="client-handle"
              type="text"
              value={clientHandle}
              onChange={(e) => setClientHandle(e.target.value)}
              placeholder="@cafe_bloom"
              className="text-input"
            />

            <label className={`dropzone ${integrationLoading ? "dropzone-busy" : ""}`}>
              <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} disabled={integrationLoading} />
              <span className="dropzone-title">{integrationLoading ? "Analysing…" : "Choose a CSV file"}</span>
              <span className="dropzone-hint">Up to 10 MB</span>
            </label>

            <p className="dialog-hint">
              No export to hand?{" "}
              <a href="/samples/sample_instagram_posts.csv" download>
                Download a sample export
              </a>{" "}
              and upload it to see a full audit.
            </p>

            <div className="dialog-divider">
              <span>or connect a Google Sheet</span>
            </div>

            <form onSubmit={handleGoogleSheetSync} className="inline-form">
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                className="text-input"
                aria-label="Google Sheet link"
              />
              <button type="submit" disabled={integrationLoading || !sheetUrl.trim()} className="btn-secondary">
                Connect
              </button>
            </form>
            <p className="dialog-hint">The sheet must be shared as &quot;Anyone with the link can view&quot;.</p>
          </div>
        </div>
      )}

      {/* 6. AI COPILOT SLIDE-OVER DRAWER */}
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
                <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase" }}>
                  Suggested Inquiries:
                </span>
                <button
                  onClick={() => handleCopilotSend("What specific algorithmic signal triggered this drop in delivery?")}
                  className="drawer-suggestion-btn"
                >
                  What caused this drop in feed recommendations?
                </button>
                <button
                  onClick={() => handleCopilotSend("Draft a concise email for my client explaining this temporary drop without alarm.")}
                  className="drawer-suggestion-btn"
                >
                  Draft an email to client explaining the variance
                </button>
                <button
                  onClick={() => handleCopilotSend("Recommend turnaround format and hook length to reset feed indexing.")}
                  className="drawer-suggestion-btn"
                >
                  Recommend turnaround format and hook length
                </button>
              </div>

              {copilotMessages.length === 0 && (
                <div style={{ textAlign: "center", padding: "28px 20px", color: "var(--text-muted)", fontSize: "var(--font-size-md)" }}>
                  Ask any question about @{data?.account_name || "target"}&apos;s reach drift, viewer drop-off, or recovery steps.
                </div>
              )}

              {copilotMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}
                >
                  {msg.role === "ai" && msg.engine && (
                    <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: msg.engine.toLowerCase().includes("gemini")
                            ? "var(--status-nominal)"
                            : "var(--text-muted)",
                        }}
                      />
                      <span>{msg.engine}</span>
                    </div>
                  )}
                  {msg.text}
                </div>
              ))}

              {copilotLoading && (
                <div style={{ textAlign: "center", padding: "14px 0", color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>
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
      </main>
    </div>

    <ClientReport
      data={data}
      agency={{
        name: agencyName,
        tagline: agencyTagline,
        monogram,
        auditorName,
        role: agencyRole,
        contact: agencyContact,
      }}
    />
    </>
  );
}

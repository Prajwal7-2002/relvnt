"use client";

import { useEffect, useRef, useState } from "react";
import ActionCard from "./components/ActionCard";
import AnomalyTable from "./components/AnomalyTable";
import ClientPortfolio from "./components/ClientPortfolio";
import ErrorBoundary from "./components/ErrorBoundary";
import HealthScore from "./components/HealthScore";
import ReachChart from "./components/ReachChart";
import AuthGate from "./components/AuthGate";
import SettingsView from "./components/SettingsView";
import { authService } from "../lib/supabaseClient";

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
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
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

  // 1. Initial Auth Session Check
  useEffect(() => {
    async function initSession() {
      try {
        const session = await authService.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          const meta = session.user.user_metadata || {};
          if (meta.agency_name) setAgencyName(meta.agency_name);
          if (meta.auditor_name) setAuditorName(meta.auditor_name);
        }
      } catch (_) {}
      setSessionLoaded(true);
    }
    initSession();
  }, []);

  // 2. Fetch Target Audit Data with Rate Limit Interception
  const fetchAnalysis = async (presetKey = "instagram_drop") => {
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
      setData(json);
      setActivePreset(presetKey);
      recordToPortfolio(json, presetKey, "Preset Benchmark");
    } catch (err) {
      setError(err.message || "Failed to load anomaly detection data.");
    } finally {
      setLoading(false);
    }
  };

  const recordToPortfolio = (analysisData, id, tag = "Audited Target") => {
    if (!analysisData) return;
    const item = {
      id: id || analysisData.account_name,
      account: analysisData.account_name || "@target",
      platform: (analysisData.platform || "Instagram").toUpperCase(),
      health_score: analysisData.health_score || 50,
      status: analysisData.prediction || analysisData.severity || "Decoupled",
      last_audited: "Just now",
      baseline: analysisData.metrics_summary?.baseline_avg || 10000,
      current: analysisData.metrics_summary?.current_value || 5000,
      change_pct: analysisData.metrics_summary?.change_pct || -50.0,
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
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After") || 30;
          throw new Error(`Rate limit reached. Please retry in ${retry} seconds.`);
        }
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.detail || `Upload failed with status ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      setActivePreset("custom_upload");
      recordToPortfolio(json, "custom_upload", "CSV Audit");
      setActiveView("audit");
      setShowQuickIngest(false);
      triggerToast("success", `✓ CSV parsed successfully: ${json.account_name} analyzed.`);
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
      setActivePreset("google_sheet");
      recordToPortfolio(json, "google_sheet", "Google Sheet");
      setActiveView("audit");
      setShowQuickIngest(false);
      triggerToast("success", `✓ Google Sheet synchronized: ${json.account_name} analyzed.`);
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
      setActivePreset("instagram_live");
      recordToPortfolio(json, "instagram_live", "Meta API Live");
      setActiveView("audit");
      triggerToast("success", `✓ Meta Graph API synchronized: ${json.account_name} analyzed.`);
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
        Initializing Relvnt Intelligence Enclave...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthGate
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          const meta = user?.user_metadata || {};
          if (meta.agency_name) setAgencyName(meta.agency_name);
          if (meta.auditor_name) setAuditorName(meta.auditor_name);
        }}
      />
    );
  }

  const monogram = (agencyName || "YA").trim().replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "YA";

  return (
    <main className="app-container">
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

      {/* 1. TOP CORPORATE SAAS NAVIGATION */}
      <header className="top-nav">
        <div className="brand-group">
          <h1 className="brand-text">
            relvnt<span>.</span>
          </h1>
          <span className="brand-subtext">Distribution Decoupling &amp; Ad Fatigue Sentinel</span>
        </div>

        {/* THREE SEGMENTED NAVIGATION PILLARS */}
        <div className="view-mode-tabs">
          <button
            onClick={() => setActiveView("radar")}
            className={`view-mode-btn ${activeView === "radar" ? "view-mode-btn-active" : ""}`}
          >
            Clients ({portfolioList.length})
          </button>
          <button
            onClick={() => setActiveView("audit")}
            className={`view-mode-btn ${activeView === "audit" ? "view-mode-btn-active" : ""}`}
          >
            Audit
          </button>
          <button
            onClick={() => setActiveView("settings")}
            className={`view-mode-btn ${activeView === "settings" ? "view-mode-btn-active" : ""}`}
          >
            Settings
          </button>
        </div>

        {/* TOP ACTIONS */}
        <div className="nav-actions">
          <button
            onClick={() => window.print()}
            className="btn-secondary"
            title="Export 1-Click Boardroom PDF Memo"
          >
            Export PDF
          </button>

          <button
            onClick={() => setShowCopilot(true)}
            className="btn-secondary"
            title="Launch AI Growth Analyst Drawer"
          >
            AI Copilot
          </button>

          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            )}
          </button>

          {/* USER & AGENCY DROPDOWN */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="btn-secondary"
              style={{ padding: "5px 10px" }}
            >
              <span style={{
                width: "22px",
                height: "22px",
                borderRadius: "4px",
                backgroundColor: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
                fontSize: "var(--font-size-2xs)",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {monogram}
              </span>
              <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{auditorName}</span>
              <span style={{ fontSize: "var(--font-size-2xs)", color: "var(--text-muted)" }}>{showUserDropdown ? "▴" : "▾"}</span>
            </button>

            {showUserDropdown && (
              <>
                <div className="dropdown-backdrop-transparent" onClick={() => setShowUserDropdown(false)} />
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-lg)",
                  minWidth: "220px",
                  zIndex: 90,
                  overflow: "hidden",
                }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface-subtle)" }}>
                    <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--text-primary)" }}>{agencyName}</div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginTop: "2px" }}>{currentUser.email}</div>
                  </div>
                  <button
                    onClick={() => { setActiveView("settings"); setShowUserDropdown(false); }}
                    className="dropdown-item"
                  >
                    Agency &amp; Webhooks Settings
                  </button>
                  <button
                    onClick={async () => {
                      await authService.signOut();
                      setCurrentUser(null);
                      setShowUserDropdown(false);
                    }}
                    className="dropdown-item"
                    style={{ color: "var(--status-drift)" }}
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. PRINT-ONLY BOARDROOM MEMO HEADER */}
      <div className="print-memo-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0F172A", paddingBottom: "14px", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "6px",
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "16px",
            }}>
              {monogram}
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A" }}>
                RELVNT × {agencyName.toUpperCase()} · EXECUTIVE DISTRIBUTION AUDIT
              </div>
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "3px" }}>
                {agencyTagline} • Certified Lead Auditor: <strong>{auditorName}</strong> ({agencyRole})
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "12px", color: "#334155" }}>
            <div><strong>Audit Target:</strong> {data?.account_name || "Client Account"}</div>
            <div style={{ color: "#64748B", marginTop: "2px" }}>
              Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.05em", color: "#64748B", textTransform: "uppercase", paddingBottom: "12px", borderBottom: "1px dashed #CBD5E1", marginBottom: "16px" }}>
          <span>{confidentiality}</span>
          <span>Official Inquiries: {agencyContact} · Protocol v2.1.0</span>
        </div>
      </div>

      {/* 3. VIEW MODE: RADAR ROSTER */}
      {activeView === "radar" && (
        <ClientPortfolio
          portfolioList={portfolioList}
          onSelectClient={(presetOrId) => {
            fetchAnalysis(presetOrId);
            setActiveView("audit");
          }}
          onOpenConnectModal={() => setShowQuickIngest(true)}
          onOpenAgencyModal={() => setActiveView("settings")}
          agencyName={agencyName}
          auditorName={auditorName}
        />
      )}

      {/* 4. VIEW MODE: DIAGNOSTIC AUDIT */}
      {activeView === "audit" && (
        <>
          {/* TARGET ACCOUNT HEADER */}
          <div className="account-bar-card">
            <div className="account-bar-left">
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
                    ? "Google Sheet Sync"
                    : activePreset === "instagram_live"
                    ? "Meta Graph API"
                    : "Industry Benchmark"}
                </span>

                <span className="account-period-tag">
                  Last 90 days
                </span>

                <button
                  onClick={() => setShowExplainer(!showExplainer)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    color: "var(--accent-primary)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {showExplainer ? "Hide methodology" : "How this is calculated"}
                </button>
              </div>
            </div>

            <div className="account-bar-actions">
              {/* Benchmark Dropdown */}
              <div className="benchmark-dropdown-wrapper">
                <button
                  onClick={() => setShowBenchmarkDropdown(!showBenchmarkDropdown)}
                  className="btn-dropdown-trigger"
                >
                  <span>Benchmark Scenarios</span>
                  <span>{showBenchmarkDropdown ? "▴" : "▾"}</span>
                </button>

                {showBenchmarkDropdown && (
                  <>
                    <div
                      className="dropdown-backdrop-transparent"
                      onClick={() => setShowBenchmarkDropdown(false)}
                    />
                    <div className="benchmark-dropdown-menu">
                      <div className="dropdown-header">Pre-Calibrated Reference Datasets</div>
                      {PRESETS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            fetchAnalysis(p.id);
                            setShowBenchmarkDropdown(false);
                          }}
                          className="dropdown-item"
                        >
                          <div className="dropdown-item-title">
                            <span>{p.label}</span>
                            {activePreset === p.id && <span>✓</span>}
                          </div>
                          <div className="dropdown-item-sub mono-num">{p.account}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowQuickIngest(true)}
                className="btn-primary"
              >
                + Quick Ingest Data
              </button>
            </div>
          </div>

          {/* METHODOLOGY EXPLAINER BANNER */}
          {showExplainer && (
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-medium)",
              borderRadius: "10px",
              padding: "18px 22px",
              marginBottom: "20px",
              fontSize: "var(--font-size-sm)",
              color: "var(--text-secondary)",
              lineHeight: 1.55,
            }}>
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>
                Scientific Decoupling Methodology:
              </strong>
              Relvnt continuously models daily account distribution using an ensemble of STL (Seasonal and Trend decomposition using Loess) and scikit-learn IsolationForest anomaly detection. A score &lt; 40 indicates that content distribution has disconnected from established follower velocity due to feed suppression or acute creative fatigue.
            </div>
          )}

          {error && (
            <div style={{ background: "var(--status-drift-bg)", border: "1px solid var(--status-drift-border)", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px", color: "var(--status-drift)", fontSize: "var(--font-size-md)" }}>
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

              {/* Reach vs Baseline Chart */}
              {data && <ReachChart data={data} />}

              {/* Forensic Incident Log */}
              {data && <AnomalyTable data={data} />}

              {/* 72-Hour Turnaround Action Plan */}
              {data && <ActionCard data={data} />}

              {/* PRINT-ONLY BOARDROOM MEMO FOOTER */}
              <div className="print-memo-footer">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px" }}>
                    <div style={{ fontWeight: 800, textTransform: "uppercase", color: "#475569", marginBottom: "20px" }}>
                      Executive Audit Attestation
                    </div>
                    <div style={{ borderBottom: "1.5px solid #0F172A", marginBottom: "6px" }} />
                    <div style={{ fontWeight: 700, color: "#0F172A" }}>{auditorName}</div>
                    <div style={{ color: "#64748B", fontSize: "10px" }}>{agencyRole} • {agencyName}</div>
                    <div style={{ color: "#94A3B8", fontSize: "9px", marginTop: "2px" }}>
                      Certified: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                  </div>

                  <div style={{ fontSize: "11px" }}>
                    <div style={{ fontWeight: 800, textTransform: "uppercase", color: "#475569", marginBottom: "20px" }}>
                      Client Acknowledgement &amp; Receipt
                    </div>
                    <div style={{ borderBottom: "1.5px solid #0F172A", marginBottom: "6px" }} />
                    <div style={{ fontWeight: 700, color: "#0F172A" }}>Authorized Client Representative</div>
                    <div style={{ color: "#64748B", fontSize: "10px" }}>{data?.account_name || "Client Enterprise"}</div>
                    <div style={{ color: "#94A3B8", fontSize: "9px", marginTop: "2px" }}>Date Received: ____________________</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#94A3B8", borderTop: "1px dashed #CBD5E1", paddingTop: "8px", textTransform: "uppercase" }}>
                  <span>{confidentiality}</span>
                  <span>Relvnt Algorithmic Intelligence · Zero-Data-Leak Enclave</span>
                </div>
              </div>
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
        <div className="quick-modal-overlay" onClick={() => setShowQuickIngest(false)}>
          <div className="quick-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Quick Ingest Client Data
              </h3>
              <button
                onClick={() => setShowQuickIngest(false)}
                style={{ background: "transparent", border: "none", fontSize: "var(--font-size-xl)", color: "var(--text-muted)", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Evaluate custom time-series performance data in real time. Choose CSV upload or live Google Sheet URL.
            </p>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Client / Handle Identifier:
              </label>
              <input
                type="text"
                value={clientHandle}
                onChange={(e) => setClientHandle(e.target.value)}
                placeholder="e.g. @acme_brand or Campaign Alpha"
                className="input-text-field"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="file-dropzone">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                />
                <div style={{ fontSize: "var(--font-size-2xl)", marginBottom: "4px" }}>📄</div>
                <div style={{ fontSize: "var(--font-size-md)", fontWeight: 600, color: "var(--text-primary)" }}>
                  Upload CSV File
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                  Meta Ads, Instagram, or TikTok exports
                </div>
              </div>

              <div style={{ textAlign: "center", fontSize: "var(--font-size-xs)", color: "var(--text-dim)", fontWeight: 600 }}>— OR —</div>

              <form onSubmit={handleGoogleSheetSync}>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="input-text-field"
                  style={{ marginBottom: "8px" }}
                />
                <button
                  type="submit"
                  disabled={integrationLoading || !sheetUrl.trim()}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {integrationLoading ? "Evaluating..." : "Sync Google Sheet"}
                </button>
              </form>
            </div>
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
  );
}

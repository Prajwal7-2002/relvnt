"use client";

import { useState } from "react";
import { authService, isSupabaseConfigured } from "../../lib/supabaseClient";

export default function AuthGate({ onAuthSuccess }) {
  const [tab, setTab] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [auditorName, setAuditorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSignIn = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both work email and password.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await authService.signIn({ email: email.trim(), password });
      setSuccessMsg("Signed in successfully. Launching workspace...");
      setTimeout(() => {
        onAuthSuccess(res.user);
      }, 300);
    } catch (err) {
      setErrorMsg(err.message || "Failed to sign in. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Work email and password are required.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await authService.signUp({
        email: email.trim(),
        password,
        agencyName: agencyName.trim() || "Your Agency",
        auditorName: auditorName.trim() || "Lead Strategist",
      });
      setSuccessMsg("Agency workspace registered successfully!");
      setTimeout(() => {
        onAuthSuccess(res.user);
      }, 400);
    } catch (err) {
      setErrorMsg(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = () => {
    const demoUser = {
      id: "guest-demo",
      email: "demo@relvnt.local",
      user_metadata: {
        agency_name: "Your Agency",
        auditor_name: "Lead Strategist",
      },
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("relvnt-auth-session", JSON.stringify(demoUser));
    }
    onAuthSuccess(demoUser);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "var(--bg-app)",
      fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
    }}>
      {/* Top Brand Tag */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 style={{
          fontSize: "var(--font-size-display)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: "var(--text-title)",
          margin: 0,
        }}>
          relvnt<span style={{ color: "var(--accent-primary)" }}>.</span>
        </h1>
        <p style={{
          fontSize: "var(--font-size-md)",
          color: "var(--text-dim)",
          marginTop: "6px",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}>
          Algorithmic Early-Warning Sentinel &amp; Agency Workspace
        </p>
      </div>

      {/* Main Auth Card */}
      <div style={{
        width: "100%",
        maxWidth: "430px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-medium)",
        borderRadius: "12px",
        boxShadow: "var(--shadow-lg)",
        padding: "32px 28px",
      }}>
        {/* Environment Status Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          borderRadius: "6px",
          background: isSupabaseConfigured ? "var(--status-nominal-bg)" : "var(--bg-surface-subtle)",
          border: `1px solid ${isSupabaseConfigured ? "var(--status-nominal-border)" : "var(--border-subtle)"}`,
          fontSize: "var(--font-size-xs)",
          color: isSupabaseConfigured ? "var(--status-nominal)" : "var(--text-muted)",
          marginBottom: "20px",
        }}>
          <span>{isSupabaseConfigured ? "● Supabase PostgreSQL Auth Active" : "○ Local Workspace Sandbox Mode"}</span>
          <span style={{ fontSize: "var(--font-size-2xs)", opacity: 0.8 }}>Tenant Security</span>
        </div>

        {/* Tab Switcher */}
        <div className="modal-tab-bar" style={{ marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => { setTab("signin"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`modal-tab-btn ${tab === "signin" ? "modal-tab-btn-active" : ""}`}
            style={{ flex: 1, padding: "8px", fontSize: "var(--font-size-md)" }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab("signup"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`modal-tab-btn ${tab === "signup" ? "modal-tab-btn-active" : ""}`}
            style={{ flex: 1, padding: "8px", fontSize: "var(--font-size-md)" }}
          >
            Create Agency Workspace
          </button>
        </div>

        {/* Feedback Banners */}
        {errorMsg && (
          <div style={{
            padding: "9px 12px",
            borderRadius: "6px",
            fontSize: "var(--font-size-sm)",
            marginBottom: "14px",
            background: "var(--status-drift-bg)",
            color: "var(--status-drift)",
            border: "1px solid var(--status-drift-border)"
          }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            padding: "9px 12px",
            borderRadius: "6px",
            fontSize: "var(--font-size-sm)",
            marginBottom: "14px",
            background: "var(--status-nominal-bg)",
            color: "var(--status-nominal)",
            border: "1px solid var(--status-nominal-border)"
          }}>
            {successMsg}
          </div>
        )}

        {/* SIGN IN TAB */}
        {tab === "signin" ? (
          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "var(--font-size-sm)", color: "var(--text-dim)", marginBottom: "5px", fontWeight: 500 }}>
                Work Email:
              </label>
              <input
                type="email"
                placeholder="strategist@agency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-text-field"
                required
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "var(--font-size-sm)", color: "var(--text-dim)", marginBottom: "5px", fontWeight: 500 }}>
                Password:
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-text-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", padding: "11px", fontSize: "var(--font-size-md)" }}
            >
              {loading ? "Authenticating..." : "Sign In to Workspace"}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => { setTab("signup"); setErrorMsg(null); setSuccessMsg(null); }}
                style={{ background: "transparent", border: "none", color: "var(--accent-primary)", fontSize: "var(--font-size-sm)", cursor: "pointer" }}
              >
                Don&apos;t have an agency workspace? Register here
              </button>
            </div>
          </form>
        ) : (
          /* CREATE AGENCY WORKSPACE TAB */
          <form onSubmit={handleSignUp}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "var(--font-size-sm)", color: "var(--text-dim)", marginBottom: "5px", fontWeight: 500 }}>
                  Agency Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Media"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="input-text-field"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--font-size-sm)", color: "var(--text-dim)", marginBottom: "5px", fontWeight: 500 }}>
                  Lead Auditor Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="input-text-field"
                />
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "var(--font-size-sm)", color: "var(--text-dim)", marginBottom: "5px", fontWeight: 500 }}>
                Work Email:
              </label>
              <input
                type="email"
                placeholder="partner@youragency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-text-field"
                required
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "var(--font-size-sm)", color: "var(--text-dim)", marginBottom: "5px", fontWeight: 500 }}>
                Password:
              </label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-text-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", padding: "11px", fontSize: "var(--font-size-md)" }}
            >
              {loading ? "Creating Workspace..." : "Register Agency Workspace"}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => { setTab("signin"); setErrorMsg(null); setSuccessMsg(null); }}
                style={{ background: "transparent", border: "none", color: "var(--accent-primary)", fontSize: "var(--font-size-sm)", cursor: "pointer" }}
              >
                Already registered? Sign In here
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Discrete Public Demo Access */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          type="button"
          onClick={handleDemoBypass}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "var(--font-size-sm)",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Explore Live Benchmark Demo (No Account Required) →
        </button>
      </div>

      {/* Security note */}
      <div style={{ marginTop: "12px", fontSize: "var(--font-size-xs)", color: "var(--text-dim)", textAlign: "center" }}>
        Zero-Data-Leak Enclave · AES-256 Session Guard · Multi-Tenant Isolation
      </div>
    </div>
  );
}

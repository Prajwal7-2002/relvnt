"use client";

import { useEffect, useRef, useState } from "react";
import { authService, isSupabaseConfigured } from "../../lib/supabaseClient";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [tab, setTab] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [auditorName, setAuditorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const overlayMouseDownRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignIn = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await authService.signIn({ email: email.trim(), password });
      setSuccessMsg("Signed in successfully!");
      setTimeout(() => {
        onAuthSuccess(res.user);
        onClose();
      }, 400);
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
        onClose();
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="modal-overlay"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) overlayMouseDownRef.current = true;
        }}
        onMouseUp={(e) => {
          if (overlayMouseDownRef.current && e.target === e.currentTarget) {
            const hasSelection = typeof window !== "undefined" && window.getSelection()?.toString()?.length > 0;
            if (!hasSelection) onClose();
          }
          overlayMouseDownRef.current = false;
        }}
      />

      <div
        className="modal-box"
        style={{ maxWidth: "440px" }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase" }}>
              RELVNT AUTH // AGENCY ACCESS
            </div>
            <h2 style={{ fontSize: "19px", fontWeight: 700, margin: "2px 0 0 0", color: "var(--text-title)" }}>
              {tab === "signin" ? "Agency Sign In" : "Create Agency Workspace"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: "22px", cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Live / Sandbox Status Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 12px",
          borderRadius: "6px",
          background: isSupabaseConfigured ? "rgba(16, 185, 129, 0.08)" : "rgba(100, 116, 139, 0.08)",
          border: `1px solid ${isSupabaseConfigured ? "rgba(16, 185, 129, 0.25)" : "rgba(100, 116, 139, 0.2)"}`,
          fontSize: "11px",
          color: isSupabaseConfigured ? "#10B981" : "#64748B",
          marginBottom: "14px",
        }}>
          <span>{isSupabaseConfigured ? "● Supabase PostgreSQL Auth Active" : "○ Local Workspace Sandbox Mode"}</span>
          <span style={{ fontSize: "10px", opacity: 0.8 }}>Tenant Isolation</span>
        </div>

        {/* TAB SELECTOR */}
        <div className="modal-tab-bar" style={{ marginBottom: "14px" }}>
          <button
            type="button"
            onClick={() => { setTab("signin"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`modal-tab-btn ${tab === "signin" ? "modal-tab-btn-active" : ""}`}
            style={{ flex: 1 }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab("signup"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`modal-tab-btn ${tab === "signup" ? "modal-tab-btn-active" : ""}`}
            style={{ flex: 1 }}
          >
            Register Agency
          </button>
        </div>

        {/* NOTICE BANNERS */}
        {errorMsg && (
          <div style={{
            padding: "9px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            marginBottom: "12px",
            background: "rgba(239, 68, 68, 0.12)",
            color: "#EF4444",
            border: "1px solid rgba(239, 68, 68, 0.25)"
          }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            padding: "9px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            marginBottom: "12px",
            background: "rgba(16, 185, 129, 0.12)",
            color: "#10B981",
            border: "1px solid rgba(16, 185, 129, 0.25)"
          }}>
            {successMsg}
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {tab === "signin" ? (
          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", fontSize: "11.5px", color: "var(--text-dim)", marginBottom: "4px" }}>
                Work Email:
              </label>
              <input
                type="email"
                placeholder="strategist@youragency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-text-field"
                required
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11.5px", color: "var(--text-dim)", marginBottom: "4px" }}>
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
              style={{ width: "100%", padding: "10px" }}
            >
              {loading ? "Authenticating..." : "Sign In to Workspace"}
            </button>

            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setTab("signup"); setErrorMsg(null); setSuccessMsg(null); }}
                style={{ background: "transparent", border: "none", color: "#0284C7", fontSize: "12px", cursor: "pointer" }}
              >
                Don&apos;t have an agency account? Register here
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: REGISTER AGENCY */
          <form onSubmit={handleSignUp}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11.5px", color: "var(--text-dim)", marginBottom: "4px" }}>
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
                <label style={{ display: "block", fontSize: "11.5px", color: "var(--text-dim)", marginBottom: "4px" }}>
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

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", fontSize: "11.5px", color: "var(--text-dim)", marginBottom: "4px" }}>
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

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11.5px", color: "var(--text-dim)", marginBottom: "4px" }}>
                Secure Password:
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
              style={{ width: "100%", padding: "10px" }}
            >
              {loading ? "Registering Workspace..." : "Create Agency Workspace"}
            </button>

            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setTab("signin"); setErrorMsg(null); setSuccessMsg(null); }}
                style={{ background: "transparent", border: "none", color: "#0284C7", fontSize: "12px", cursor: "pointer" }}
              >
                Already have an account? Sign In here
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

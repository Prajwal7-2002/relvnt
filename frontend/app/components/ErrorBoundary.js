"use client";

import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Relvnt UI Safeguard caught render anomaly:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-medium)",
            borderRadius: "12px",
            padding: "36px 32px",
            margin: "24px 0",
            boxShadow: "var(--shadow-card)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "6px",
              background: "var(--status-warn-bg)",
              border: "1px solid var(--status-warn-border)",
              color: "var(--status-warn)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "16px",
            }}
          >
            <span>●</span>
            <span>Sentinel Viewport Safeguard</span>
          </div>

          <h2
            style={{
              fontSize: "var(--font-size-xl)",
              fontWeight: 700,
              color: "var(--text-title)",
              margin: "0 0 8px 0",
            }}
          >
            Telemetry View Temporarily Degraded
          </h2>

          <p
            style={{
              fontSize: "var(--font-size-md)",
              color: "var(--text-muted)",
              maxWidth: "520px",
              margin: "0 auto 20px auto",
              lineHeight: 1.55,
            }}
          >
            An unexpected visual property was received from the stream. The underlying ML engine and calculations remain completely safe and uncompromised.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button onClick={this.handleReset} className="btn-primary">
              Reload Active Telemetry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

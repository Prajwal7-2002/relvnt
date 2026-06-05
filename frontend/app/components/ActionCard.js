"use client";

function alertColor(alertLevel) {
  if (alertLevel === "green") return "#1D9E75";
  if (alertLevel === "yellow") return "#EF9F27";
  return "#E24B4A";
}

export default function ActionCard({ data }) {
  const color = alertColor(data.alert_level);
  const confidence = Math.round(Number(data.confidence || 0) * 100);
  const isDemo = data.data_source !== "instagram";

  return (
    <section
      className="action-card"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="action-card-main">
        <div>
          <h2>This Week&apos;s Action</h2>
          <p>{data.recommended_action}</p>
        </div>
        <p className="confidence-pill">Confidence: {confidence}%</p>
      </div>
      {isDemo && (
        <p className="demo-note">
          Demo data is being shown because Instagram reach data was not available.
          Confidence is model confidence on synthetic fallback data.
        </p>
      )}
    </section>
  );
}

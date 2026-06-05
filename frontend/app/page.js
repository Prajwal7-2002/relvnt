import ActionCard from "./components/ActionCard";
import HealthScore from "./components/HealthScore";
import ReachChart from "./components/ReachChart";

export const dynamic = "force-dynamic";

async function getAnalysis() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const response = await fetch(`${apiUrl}/analyze`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Analyze request failed with status ${response.status}`);
  }

  return response.json();
}

export default async function Page() {
  let data = null;
  let error = null;

  try {
    data = await getAnalysis();
  } catch (err) {
    error = err.message || "Unable to fetch analysis";
  }

  if (error) {
    return (
      <main className="error-shell">
        <section className="error-card">
          <p className="error-label">Error</p>
          <h1>Analysis unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="loading-shell">
        <div className="loading-spinner" />
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p>Relvnt</p>
            <h1>Instagram reach intelligence</h1>
          </div>
          <span>{data.data_source === "instagram" ? "Live data" : "Demo data"}</span>
        </header>

        <section className="dashboard-grid">
          <HealthScore data={data} />
          <ReachChart data={data} />
        </section>

        <ActionCard data={data} />
      </div>
    </main>
  );
}

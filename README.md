# RELVNT SENTINEL

> **Distribution & Ad Fatigue Early-Warning System**  
> *Scikit-Learn IsolationForest + Day-of-Week Seasonality + Optional Generative AI Briefings*

---

## What is Relvnt?

**Relvnt Sentinel** is an early-warning radar for social media creators, performance media buyers, and marketing agencies.

It targets the **"Silent Distribution Crash"**:
- An Instagram algorithm change or low-retention video quietly throttles an account's reach.
- An ad creative burns out on Meta Ads, causing frequency to climb and ROAS to fall.
- **The Problem:** Traditional dashboards (Sprout Social, Hootsuite) are rear-view mirrors. They report declines days or weeks later, after clients have churned or budgets are wasted.

Relvnt compares each account against its own seasonality-adjusted baseline, flags early signs of decay, and turns the result into a client-ready brief that can be sent to Slack, Discord, or any webhook.

---

## How It Works

```
┌────────────────────────────────────────────────────────┐
│ 1. INGESTION                                           │
│    • CSV upload (Meta Ads, Instagram, YouTube exports) │
│    • Public Google Sheets sync                         │
│    • Instagram Graph API connector                     │
│    • Currency stripping & summary-row filtering        │
└───────────────────────────┬────────────────────────────┘
                            │ Clean daily time-series
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. ANOMALY ENGINE (local, no external calls)           │
│    • Day-of-week seasonality normalisation             │
│    • Winsorized, outlier-resistant baseline            │
│    • Scikit-Learn IsolationForest (100 trees)          │
│    • Z-score, slope & volatility indicators            │
└───────────────────────────┬────────────────────────────┘
                            │ Health score + anomaly points
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. BRIEFING AGENT                                      │
│    • Google Gemini (optional, free tier)               │
│    • Deterministic local fallback when no key is set   │
│    • 3-phase, 72-hour recovery plan                    │
│    • Interactive copilot for follow-up questions       │
└───────────────────────────┬────────────────────────────┘
                            │ Formatted briefs
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. DISPATCH & REPORTING                                │
│    • Slack / Discord / generic webhook alerts          │
│    • White-label agency branding                       │
└────────────────────────────────────────────────────────┘
```

---

## Project Structure

```text
relvnt/
├── backend/
│   ├── main.py                  # FastAPI app, security headers, CORS, router mounting
│   ├── requirements.txt         # Pinned deps, generated from uv.lock (see below)
│   ├── Dockerfile
│   ├── core/
│   │   ├── security.py          # Bearer-token tenant context
│   │   ├── network_security.py  # SSRF guard for outbound URLs
│   │   ├── rate_limiter.py      # Tiered sliding-window rate limiting
│   │   └── envelopes.py
│   ├── routers/
│   │   ├── analytics.py         # /analyze (presets, JSON, CSV, Sheets, Instagram), /copilot
│   │   ├── radar.py             # /radar/scan, /alerts/test, /alerts/slack
│   │   └── agency.py            # Agency profile & portfolio
│   ├── ml/
│   │   ├── anomaly_engine.py    # Seasonality, baselines, IsolationForest, health score
│   │   └── presets.py           # Benchmark dataset loader
│   └── services/
│       ├── ai_agent.py          # Gemini + local fallback briefings and copilot
│       ├── alert_dispatcher.py  # Async Slack/Discord/webhook delivery
│       ├── csv_parser.py        # Defensive CSV parser
│       ├── instagram_api.py     # Meta Graph API insights connector
│       └── supabase_service.py  # Data access layer (in-memory fallback)
├── frontend/
│   ├── app/
│   │   ├── page.js              # Main workspace
│   │   ├── layout.js
│   │   ├── globals.css
│   │   └── components/          # AuthGate, ClientPortfolio, SettingsView, ReachChart, ...
│   ├── lib/supabaseClient.js    # Supabase Auth client with local sandbox fallback
│   ├── middleware.js
│   └── package.json             # Next.js 14 App Router
├── supabase/schema.sql          # Multi-tenant schema with Row-Level Security
├── data/benchmarks/             # Real Instagram creator & Meta Ads benchmark CSVs
├── tests/                       # Pytest suite
├── .github/workflows/ci.yml     # Tests, dependency drift check, frontend build
├── render.yaml                  # Render blueprint (backend)
├── pyproject.toml / uv.lock     # Python dependencies (source of truth)
└── Procfile
```

---

## Getting Started Locally

### Prerequisites
- **Python 3.12+** with [uv](https://github.com/astral-sh/uv) (recommended) or a standard venv
- **Node.js 18.17+**

### 1. Backend

```bash
git clone https://github.com/Prajwal7-2002/relvnt.git
cd relvnt

# Install dependencies (includes the dev group with pytest)
uv sync

# Or with pip
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt

# Start the API on http://localhost:8000
cd backend
uv run python -m uvicorn main:app --port 8000 --reload
```

Copy `backend/.env.example` to `backend/.env` to configure optional keys (Gemini, Instagram).

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tests

```bash
uv run pytest tests -q
```

The suite covers the health endpoint and security headers, IsolationForest scoring, defensive CSV parsing (dirty currencies, BOMs), benchmark presets, the copilot endpoint, and the local-fallback briefing path. CI runs it on every push and pull request, along with a frontend production build.

### Updating Python dependencies

`pyproject.toml` and `uv.lock` are the source of truth. After changing dependencies, regenerate the pinned requirements file used for deployment:

```bash
uv lock
uv export --no-dev --no-hashes --no-header --no-emit-project -o backend/requirements.txt
```

CI fails if `backend/requirements.txt` drifts from `uv.lock`.

---

## Deployment

### Frontend
Any static/Next.js host works. Set the root directory to `frontend` and add:
- `NEXT_PUBLIC_API_URL`: your backend URL
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional)

Note: Vercel's free Hobby plan is for non-commercial use only. For a commercial deployment on a free tier, consider Cloudflare Pages or Netlify.

### Backend (Render)
1. **New +** → **Blueprint** on [Render](https://render.com) and select this repository.
2. Render builds the service defined in `render.yaml` (root directory `backend`).
3. Optionally set `GEMINI_API_KEY` for live AI briefings.

Render's free tier sleeps after 15 minutes of inactivity; the first request after that takes longer while it wakes.

---

## Data Handling

- **Local analysis:** seasonality decomposition and IsolationForest scoring run in memory on the server.
- **Optional AI:** when `GEMINI_API_KEY` is set, summary metrics are sent to Google Gemini to write the briefing. On Google's free tier, prompts may be used to improve Google's products, so leave the key unset if that is not acceptable for your data.
- **Persistence:** the backend currently keeps agency and client records in memory; Supabase-backed persistence is in progress (`supabase/schema.sql`).
- **Hardening:** security headers (`nosniff`, `DENY`, HSTS, CSP), SSRF validation on outbound URLs, upload size limits, and rate limiting.

---

## License

MIT License. Built for creators, performance marketers, and growth engineering teams.

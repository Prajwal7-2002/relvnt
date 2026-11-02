# RELVNT SENTINEL

> **Autonomous Distribution & Ad Fatigue Early-Warning System**  
> *Compound AI: Scikit-Learn IsolationForest + Day-of-Week Seasonality + Generative AI Reasoning*

---

## What is Relvnt?

**Relvnt Sentinel** is a production-grade algorithmic early-warning radar built for social media creators, performance media buyers, and marketing agencies.

It solves the **"Silent Distribution Crash"**:
- An Instagram algorithm change or low-retention video silently throttles an account's explore reach.
- An ad creative burns out on Meta Ads, causing audience frequency to spike and ROAS to collapse.
- **The Problem:** Traditional dashboards (Sprout Social, Hootsuite) are rear-view mirrors—they only report on historical declines days or weeks later, after clients have churned or ad budgets are wasted.

Relvnt detects distribution decay **3–5 days in advance**, runs on authentic mathematical machine learning, generates clinical root-cause diagnoses, and formats client-ready 72-hour incident briefs for Slack, WhatsApp, and email.

---

## System Architecture: The Compound AI Pipeline

```
┌────────────────────────────────────────────────────────┐
│ 1. DEFENSIVE INGESTION LAYER                           │
│    • Zero-Auth CSV Dropzone (Meta Ads, IG, YouTube)    │
│    • Direct Instagram Graph API Integration            │
│    • Automatic currency stripping & summary row filters│
└───────────────────────────┬────────────────────────────┘
                            │ Clean Time-Series
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. QUANTITATIVE ML ANOMALY ENGINE (5ms Local)          │
│    • Day-of-Week Seasonality Decomposition (DOW Factor)│
│    • Winsorized Outlier-Resistant Baseline (P90 Cap)   │
│    • Scikit-Learn IsolationForest (100 Decision Trees) │
│    • Multi-Scale Z-Score & Volatility Indexing         │
└───────────────────────────┬────────────────────────────┘
                            │ ML Anomaly Vectors
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. COGNITIVE AI REASONING AGENT                        │
│    • Live AI: Google Gemini 1.5 Flash ($0 Free Tier)   │
│    • Enclave Mode: Deterministic Local Synthesizer     │
│    • Generates 72-Hour Phased Tactical Recovery Runbook│
│    • Interactive Slide-Over AI Copilot Console         │
└───────────────────────────┬────────────────────────────┘
                            │ Formatted Briefs
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. EXECUTIVE DISPATCH & CLIENT REPORTING               │
│    • 1-Click Slack / WhatsApp / Notion Markdown Brief  │
│    • Downloadable Incident Logs (`INC-2026-*`)         │
└────────────────────────────────────────────────────────┘
```

---

## Project Structure

```text
relvnt/
├── backend/
│   ├── main.py                     # FastAPI application & security middleware
│   ├── requirements.txt            # Production Python dependencies
│   ├── Dockerfile                  # Container deployment configuration
│   ├── .dockerignore
│   ├── ml/
│   │   ├── anomaly_engine.py       # IsolationForest ML + Seasonality + Baselines
│   │   └── presets.py              # Authentic benchmark dataset loader
│   └── services/
│       ├── ai_agent.py             # Hybrid AI Agent (Gemini + Local Enclave)
│       ├── csv_parser.py           # Defensive, dirty-currency resilient CSV parser
│       └── instagram_api.py        # Meta Graph API live insights connector
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ActionCard.js       # Clinical Incident Brief & 72H Runbook
│   │   │   ├── HealthScore.js      # 10-Segment Calibrated Linear Hardware Meter
│   │   │   └── ReachChart.js       # Quantitative Bloomberg-style Trajectory Chart
│   │   ├── globals.css             # Flagship Obsidian B2B Design System
│   │   ├── layout.js               # Root layout & technical metadata
│   │   └── page.js                 # Command deck & Slide-over AI Copilot
│   ├── public/samples/             # 1-Click downloadable authentic benchmark CSVs
│   └── package.json                # Next.js 14 App Router dependencies
├── data/
│   └── benchmarks/
│       ├── real_instagram_creator.csv # 99 days of real post insights
│       └── real_meta_ads_campaign.csv # 90 days of real Kaggle conversion tracking
├── tests/
│   └── test_production_sentinel.py # Automated Pytest test suite (10/10 passing)
├── render.yaml                     # 1-Click Render infrastructure blueprint
├── pyproject.toml                  # Astral uv packaging configuration
└── uv.lock                         # Exact reproducible dependency lockfile
```

---

## Getting Started Locally

### Prerequisites
- **Python 3.12+** (Managed with [Astral uv](https://github.com/astral-sh/uv) or standard venv)
- **Node.js 18+**

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/Prajwal7-2002/relvnt.git
cd relvnt

# Install Python dependencies using uv (recommended, installs in seconds)
uv sync

# Or using standard pip
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt

# Start the backend server (runs on http://localhost:8000)
cd backend
uv run python -m uvicorn main:app --port 8000 --reload
```

### 2. Frontend Setup

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Verification & Tests

Run the comprehensive unit test suite:

```bash
uv run python -m pytest tests/test_production_sentinel.py -v
```

All 10 unit tests verify:
- Health check & security headers (`nosniff`, `DENY`, `strict-origin`)
- Scikit-learn `IsolationForest` ensemble ML scoring
- Defensive CSV parsing with dirty currencies and BOMs
- Authentic creator & ad benchmarks
- Slide-over AI Copilot endpoint
- Zero-Data-Leak local inference guarantees

---

## Production Deployment ($0 / Month)

### 1. Frontend: Deploy to Vercel (Free)
1. Import `Prajwal7-2002/relvnt` into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://<your-backend-url>` (e.g., `https://relvnt-api.onrender.com` or `https://relvnt.koyeb.app`)
4. Click **Deploy**.

### 2. Backend: Deploy to Render or Koyeb (Free)
- **Using Render (`render.yaml` Blueprint):**
  1. Click **New +** → **Blueprint** on [Render](https://render.com).
  2. Select the repository. Render will automatically build the service defined in `render.yaml`.
  3. (Optional) Set `GEMINI_API_KEY` for live generative reasoning.
- **Using Koyeb (Never Sleeps):**
  1. Click **Create App** on [Koyeb](https://koyeb.com).
  2. Select GitHub repo `Prajwal7-2002/relvnt`, set root directory to `backend`.
  3. Build command: `pip install -r requirements.txt`, Run: `uvicorn main:app --host 0.0.0.0 --port 8000`.

### 💡 Keeping the Backend Alive 24/7 at $0 Cost
Render's free tier spins down after 15 minutes of inactivity. To keep your backend **warm and instantaneous 24/7/365 without paying a cent**:
1. Create a free account at [UptimeRobot](https://uptimerobot.com) or [Cron-Job.org](https://cron-job.org).
2. Add an HTTP monitor pointing to your backend's `/health` endpoint (e.g., `https://relvnt-api.onrender.com/health`).
3. Set the interval to **every 10 minutes**.
4. Because the ping arrives every 10 minutes, the 15-minute idle timer never fires, and your backend **never sleeps**.

---

## Data Governance & Privacy Guarantee

- **Zero Egress by Default:** Calculations, seasonality decompositions, and `IsolationForest` decision trees execute exclusively in volatile RAM.
- **No Third-Party Model Training:** Ingested customer performance data is never stored to disk or transmitted to public LLM training clusters.
- **Enterprise Ready:** Sanitized headers prevent CSV formula injection; strict security headers protect against MIME sniffing and clickjacking.

---

## License

MIT License. Built for creators, performance marketers, and growth engineering teams.

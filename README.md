# Relvnt

Relvnt is a simple but powerful MVP for creators and brands who want to understand whether their Instagram reach is trending up or heading toward a drop before it becomes obvious.

The app looks at recent reach patterns, scores the account's health, and predicts whether the next few weeks could bring a performance problem. It is designed to give a quick, readable signal instead of burying you in raw metrics.

## What this project does

- Pulls recent Instagram reach data from the Facebook/Instagram Graph API
- Processes the last 14 to 90 days of performance data
- Uses a TensorFlow LSTM model to estimate account health and future risk
- Returns a health score, trend prediction, confidence level, and recommended action
- Displays the result in a clean Next.js dashboard

This is a good fit for an early-stage creator intelligence tool, where the goal is to alert someone before a sudden drop in reach starts hurting growth.

## How it works

1. The backend fetches daily reach values from Instagram.
2. The data is cleaned and transformed for the model.
3. A trained LSTM model evaluates the recent pattern.
4. The API returns a response containing:
   - health score
   - alert level
   - prediction
   - confidence
   - recommended action
   - recent reach history
5. The frontend renders that response in a dashboard.

## Project structure

```text
relvnt/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── ml/
│   │   ├── data_generator.py
│   │   ├── lstm_model.py
│   │   ├── preprocessor.py
│   │   └── saved_models/
│   └── services/
│       └── instagram_api.py
├── frontend/
│   ├── app/
│   ├── package.json
│   ├── next.config.js
│   ├── postcss.config.js
│   └── tailwind.config.js
├── data/
│   └── synthetic/
│       └── training_data.csv
└── README.md
```

## Prerequisites

Before you start, make sure you have:

- Python 3.10+
- Node.js 18+
- An Instagram Business account
- A valid Instagram access token and business account ID

## Setup

### 1) Create a Python environment

```bash
cd D:\My_projects\relvnt
python -m venv .venv
.\.venv\Scripts\activate
pip install -r backend\requirements.txt
```

### 2) Set up environment variables

Create a file named `.env` inside the `backend` folder with your Instagram credentials:

```env
INSTAGRAM_ACCESS_TOKEN=your_access_token_here
INSTAGRAM_BUSINESS_ID=your_business_id_here
```

This file is required because the backend reads those values from the Instagram API service.

### 3) Install frontend dependencies

```bash
cd frontend
npm install
```

## Run the app

### Start the backend

From the project root:

```bash
cd backend
python main.py
```

That will load the model if it already exists, or train it if it does not. The backend exposes the API on:

- http://localhost:8000/health
- http://localhost:8000/analyze

You can also run it with Uvicorn if you prefer:

```bash
cd backend
uvicorn main:app --reload
```

### Start the frontend

Open a second terminal and run:

```bash
cd frontend
npm run dev
```

Then open:

- http://localhost:3000

## What the dashboard shows

The frontend is a simple dashboard that displays:

- health score in a circular visual
- current prediction status
- recent reach trend
- suggested action tied to the model output

## Notes

- The first run may take a little time because the model is trained or loaded from disk.
- If no real Instagram data is available, the backend will not be able to produce a trustworthy analysis.
- The saved model lives under `backend/ml/saved_models/` and is reused on later runs.

## Good next steps

This MVP is a strong base for expanding into:

- more creator accounts and account groups
- multi-metric predictions beyond reach
- user authentication and saved dashboards
- alerts for reach drops or unusual spikes
- a better historical model training pipeline

If you want, the next step could be turning this into a cleaner production-ready app with better onboarding, account management, and a more robust ML pipeline.


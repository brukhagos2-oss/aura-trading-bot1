# Deploying Web-Based Automated Trading Bot to Railway & GitHub

This repository contains the complete fullstack automated trading platform driven by **Pure Price Action (0 Indicators)**, with strict **Anti-Overlap state management**, **Multi-Timeframe Analysis**, **Scalper Mode**, and **10-Year Historical Edge calibration**.

---

## 🚀 Quick Step 1: Push Code to GitHub

```bash
# 1. Initialize git (if not already done)
git init
git add .
git commit -m "feat: multi-market price action trading bot"

# 2. Add your GitHub repository remote
git remote add origin https://github.com/YOUR_USERNAME/trading-bot.git
git branch -M main
git push -u origin main
```

---

## 🚂 Quick Step 2: Deploy to Railway (24/7 Hosting)

### Method A: Via Railway Web Dashboard (Recommended - 2 Minutes)

1. Open [Railway.com](https://railway.com) and click **"New Project"**.
2. Select **"Deploy from GitHub repo"** and pick your repository.
3. Click **"Add a Service"** &rarr; **"Database"** &rarr; **"PostgreSQL"**.
4. Railway will automatically link the database and provide the `DATABASE_URL` environment variable.
5. In your web service **Settings**:
   - Set **Start Command**: `npm run start` (or leave default, defined in `railway.json`).
   - Add Environment Variable: `NODE_ENV=production`.
6. Railway will automatically build and start the app with healthcheck verification!

---

### Method B: Via Railway CLI

```bash
# 1. Install CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Create & link project
railway init

# 4. Add PostgreSQL plugin
railway add --plugin postgresql

# 5. Push and deploy
railway up
```

---

## 🐍 Optional: Running the Companion Python CCXT Bot

If you prefer to run the standalone Python backend service with CCXT and Binance connection on Railway:

1. Create a service pointing to root directory `python_bot/`.
2. Start command: `python main.py`.
3. All dependencies are pre-configured in `python_bot/requirements.txt`.

---

## ⚙️ Environment Variables Reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-injected by Railway Postgres plugin) |
| `PORT` | Web port (defaults to 3000) |
| `NODE_ENV` | `production` |

# AlphaMetrics — Full Stack NSE Paper Trading Simulator

A professional-grade paper trading simulator for Indian stock markets (NSE), built with **React + Vite** frontend and **Node.js + Express + MongoDB Atlas** backend. Real stock prices fetched live from **Yahoo Finance**.

---

## What's Inside

### User Features
| Feature | Description |
|---|---|
| 📊 Dashboard | Live portfolio value, real P&L, equity curve from actual trades, top gainers/losers |
| 📈 Market | Live/simulated NSE stock prices, interactive price charts (1W/1M/3M/1Y) |
| 🔍 Stock Detail | Full stock stats, candlestick chart, news, set price alerts — all in one page |
| 💼 Portfolio | Open positions with live P&L, real equity curve, sector allocation |
| 📋 Orders | Complete trade history with filters |
| ⭐ Watchlist | Add/remove stocks, live price updates |
| 🏆 Leaderboard | Real-time ranking of all traders by P&L |
| 🔔 Price Alerts | Set target prices — server checks every 60s and triggers alerts |
| ⟳ Backtesting | Test 6 strategies (SMA, EMA, RSI, MACD, Bollinger, S&R) on any stock |
| ⚙ Settings | Edit profile, avatar color, set/top-up balance, reset portfolio, data mode toggle |

### Admin Features
| Feature | Description |
|---|---|
| Admin Dashboard | Platform-wide stats, real trade volume chart, recent users & trades |
| User Management | View all users, activate/deactivate accounts |
| All Trades | Full platform trade history with search and filters |
| Analytics | Leaderboard, sector distribution, retention chart |

### Smart Data Mode Toggle
Switch between two modes anytime from the sidebar or Settings:
- **🎮 Simulation** — Simulated prices that update every 3 seconds. Works 24/7, perfect for after-hours testing
- **🌐 Live** — Real NSE prices from Yahoo Finance. Works during market hours (9:15 AM – 3:30 PM IST, weekdays)

---

## Project Structure

```
alphametrics-fullstack/
├── package.json                ← root — runs both frontend + backend together
├── backend/
│   ├── package.json
│   ├── .env                    ← MongoDB Atlas URI + JWT secret (edit this)
│   └── src/
│       ├── index.js            ← Express server + price alert cron job
│       ├── seed.js             ← Creates demo users in MongoDB
│       ├── models/             ← User, Trade, Position, Alert, PnlSnapshot
│       ├── routes/             ← auth, stocks, trades, portfolio, watchlist,
│       │                          alerts, leaderboard, admin
│       └── middleware/         ← JWT auth guard
└── frontend/
    ├── package.json
    ├── vite.config.js          ← Vite 5 + proxy to backend :5000
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx             ← All routes defined here
        ├── api/index.js        ← All API calls in one place
        ├── context/
        │   └── AuthContext.jsx ← Auth, balance, watchlist, data mode state
        ├── data/
        │   ├── mockStocks.js   ← Simulation mode price generator
        │   └── mockData.jsx    ← Chart helpers + backtest utilities
        ├── components/         ← AppLayout, Sidebar, Topbar, BuySellModal
        └── pages/
            ├── AuthPage.jsx
            ├── user/           ← Dashboard, Market, StockDetail, Portfolio,
            │                      Orders, Watchlist, Backtest, Leaderboard,
            │                      Alerts, UserSettings
            └── admin/          ← AdminDashboard, AdminUsers, AdminTrades,
                                   AdminAnalytics, AdminSettings
```

---

## Prerequisites

- **Node.js** v18 or higher — check with `node -v`
- **MongoDB Atlas** free account — no local database needed

---

## Step 1 — Create MongoDB Atlas Cluster (free)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → sign in or register
2. Click **"Build a Database"** → choose **Free (M0)** → any region → **Create**
3. Set a **Username** and **Password** (save these!)
4. Go to **Network Access** → **Add IP Address** → **"Allow Access from Anywhere"** (`0.0.0.0/0`) → **Confirm**
5. Go to **Database** → **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## Step 2 — Configure Environment

Open `backend/.env` and paste your connection string:

```env
PORT=5000
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/alphametrics?retryWrites=true&w=majority
JWT_SECRET=alphametrics_super_secret_key_change_in_production
```

Replace `youruser`, `yourpassword`, and `cluster0.xxxxx` with your real values.
The `/alphametrics` at the end is the database name — Atlas creates it automatically.

---

## Step 3 — Install All Dependencies

```bash
# Run from the root alphametrics-fullstack/ folder
npm install
npm install --prefix backend
npm install --prefix frontend
```

---

## Step 4 — Seed Demo Users (run once)

```bash
cd backend
node src/seed.js
cd ..
```

Expected output:
```
✅ Connected to MongoDB
🗑  Cleared existing users
   ✓ Created: krunal@example.com
   ✓ Created: priya@example.com
   ✓ Created: rahul@example.com
   ✓ Created: sneha@example.com
   ✓ Created: vikram@example.com
   ✓ Created: kavya@example.com
   ✓ Created: admin@alphametrics.in
🌱 Seed complete! Demo accounts ready.
```

---

## Step 5 — Run the Project

```bash
# From the root alphametrics-fullstack/ folder
npm run dev
```

This starts both servers simultaneously:
- **Backend** → [http://localhost:5000](http://localhost:5000)
- **Frontend** → [http://localhost:5173](http://localhost:5173)

Open **http://localhost:5173** in your browser.

---

## Demo Accounts

| Role  | Email | Password |
|-------|-------|----------|
| 👤 User | krunal@example.com | password123 |
| 👤 User | priya@example.com | password123 |
| 👤 User | rahul@example.com | password123 |
| 🔑 Admin | admin@alphametrics.in | admin123 |

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT token |
| GET | `/api/auth/me` | User | Get current logged-in user |
| PATCH | `/api/auth/profile` | User | Update name, email, password, balance, avatar |
| POST | `/api/auth/reset-portfolio` | User | Wipe trades & positions, restore balance |

### Stocks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/stocks` | User | All 15 NSE quotes (60s cache) |
| GET | `/api/stocks/:symbol` | User | Single stock quote |
| GET | `/api/stocks/:symbol/history?period=3M` | User | Historical OHLC candles |

### Trading
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trades` | User | User's full order history |
| POST | `/api/trades` | User | Execute BUY or SELL order |
| GET | `/api/portfolio` | User | Open positions |
| GET | `/api/portfolio/equity?days=30` | User | Real equity curve from trade history |
| GET | `/api/portfolio/stats` | User | Day P&L, trade counts |

### Watchlist & Alerts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/watchlist` | User | Get watchlist symbols |
| POST | `/api/watchlist/:symbol` | User | Add symbol |
| DELETE | `/api/watchlist/:symbol` | User | Remove symbol |
| GET | `/api/alerts` | User | Get all alerts |
| POST | `/api/alerts` | User | Create price alert |
| DELETE | `/api/alerts/:id` | User | Delete alert |
| PATCH | `/api/alerts/:id/reset` | User | Re-arm triggered alert |

### Leaderboard & Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leaderboard` | User | Top 20 traders ranked by P&L |
| GET | `/api/admin/stats` | Admin | Platform KPIs |
| GET | `/api/admin/users` | Admin | All users |
| PATCH | `/api/admin/users/:id/status` | Admin | Activate / deactivate user |
| GET | `/api/admin/trades` | Admin | All platform trades |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6 |
| Charts | Recharts |
| Backend | Node.js 18+, Express 4 |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Stock Data | yahoo-finance2 (real NSE prices via `.NS` suffix) |
| Monorepo | concurrently (single `npm run dev` command) |

---

## How It Works

**Stock prices** — Yahoo Finance is queried using NSE symbols with the `.NS` suffix (e.g. `RELIANCE.NS`). Results are cached in memory for 60 seconds to avoid rate limiting.

**Trading** — When a user executes a BUY, the trade is saved to MongoDB, the position is created/updated with weighted average price, and the user's balance is deducted. SELL does the reverse and calculates realized P&L.

**Equity curve** — The portfolio chart is built by replaying all of the user's actual trades day-by-day from MongoDB — not random data.

**Price alerts** — A `setInterval` on the backend checks all active alerts every 60 seconds against live Yahoo Finance prices and marks them as triggered when the target is hit.

**JWT auth** — Tokens are stored in `localStorage` under `am_token` and sent as `Bearer` headers on every API request.

---

## Common Commands

```bash
# Install everything
npm install && npm install --prefix backend && npm install --prefix frontend

# Seed demo users (run from root)
cd backend && node src/seed.js && cd ..

# Start everything
npm run dev

# Start only backend
npm run backend

# Start only frontend
npm run frontend
```

---

## Troubleshooting

**MongoDB connection fails** — Check your Atlas URI in `backend/.env`. Make sure Network Access has `0.0.0.0/0` and your username/password are correct.

**"Cannot find module seed.js"** — You must `cd backend` first before running `node src/seed.js`.

**Market shows no data** — Switch to Simulation mode in the sidebar toggle (market may be closed). Live data only works 9:15 AM – 3:30 PM IST on weekdays.

**Vite JSX error** — Make sure all files containing JSX use the `.jsx` extension, not `.js`.

---

## Deploying to Production

### Architecture
- **Frontend** → Vercel (auto-deploy from GitHub)
- **Backend** → Render.com free tier (always-on Node server)
- **Database** → MongoDB Atlas (already configured)

---

### Step 1 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub repo
3. Set these fields:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Environment:** `Node`
4. Add **Environment Variables** (do NOT put these in .env on GitHub):
   ```
   MONGO_URI       = your MongoDB Atlas URI
   JWT_SECRET      = a strong random secret (openssl rand -hex 32)
   FRONTEND_URL    = https://your-app.vercel.app   ← add after Vercel deploy
   PORT            = 10000
   ```
5. Deploy — copy the Render URL e.g. `https://alphametrics-api.onrender.com`

---

### Step 2 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import GitHub repo
2. Vercel auto-detects settings from `vercel.json` — no changes needed
3. Add **Environment Variable** in Vercel dashboard:
   ```
   VITE_API_URL = https://alphametrics-api.onrender.com
   ```
4. Deploy

---

### Step 3 — Connect them

1. Copy your Vercel URL e.g. `https://alphametrics.vercel.app`
2. Go back to Render → your backend service → **Environment** tab
3. Set `FRONTEND_URL = https://alphametrics.vercel.app`
4. Click **Save** — Render redeploys automatically

---

### Step 4 — Update frontend API base URL

In `frontend/src/api/index.js`, change:
```js
const BASE = "/api";
```
to:
```js
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";
```
This makes it use `localhost:5000` locally and your Render URL in production.

---

### Security checklist before going live
- [ ] `backend/.env` is in `.gitignore` ✅
- [ ] All secrets set as environment variables on Render, NOT in code
- [ ] JWT_SECRET changed from the default placeholder
- [ ] MongoDB Atlas Network Access includes `0.0.0.0/0` (for Render's dynamic IPs)
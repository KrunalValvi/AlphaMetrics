# AlphaMetrics — Full Stack Trading Simulator

NSE paper trading simulator with a **React + Vite** frontend and **Node.js + Express + MongoDB Atlas** backend.
Real stock prices are fetched from **Yahoo Finance** (`yahoo-finance2`).

---

## Project Structure

```
alphametrics-fullstack/
├── package.json          ← root (runs both together)
├── backend/
│   ├── package.json
│   ├── .env              ← MongoDB Atlas URI + JWT secret
│   └── src/
│       ├── index.js      ← Express server entry
│       ├── seed.js       ← Creates demo users in DB
│       ├── models/       ← User, Trade, Position
│       ├── routes/       ← auth, stocks, trades, portfolio, watchlist, admin
│       └── middleware/   ← JWT auth guard
└── frontend/
    ├── package.json
    ├── vite.config.js    ← Vite + proxy to :5000
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/index.js  ← All API calls in one place
        ├── context/AuthContext.js
        ├── components/
        └── pages/
```

---

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB Atlas** account (free) — no local MongoDB needed!
  Sign up at https://www.mongodb.com/cloud/atlas/register

---

## Step 1 — Create a Free MongoDB Atlas Cluster

1. Go to https://cloud.mongodb.com and sign in / register
2. Click **"Build a Database"** → choose **Free (M0)** tier → any region → **Create**
3. Set a **Username** and **Password** (remember these!)
4. Go to **Network Access** (left sidebar) → **Add IP Address** → select **"Allow Access from Anywhere"** (`0.0.0.0/0`) → **Confirm**
5. Go back to **Database** → click **Connect** on your cluster → **Drivers**
6. Copy the connection string, it looks like:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```

---

## Step 2 — Configure the .env file

Open `backend/.env` and replace the placeholder with your real Atlas URI:

```
PORT=5000
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.abcde.mongodb.net/alphametrics?retryWrites=true&w=majority
JWT_SECRET=alphametrics_super_secret_key_change_in_production
```

- Replace `youruser`, `yourpassword`, `cluster0.abcde` with your actual values
- The `/alphametrics` part is the database name — Atlas creates it automatically on first use

---

## Step 3 — Install Dependencies

```bash
# From the root alphametrics-fullstack/ folder:
npm install
npm install --prefix backend
npm install --prefix frontend
```

---

## Step 4 — Seed Demo Users (run once)

```bash
cd backend
node src/seed.js
```

You should see:
```
✅ Connected to MongoDB
🗑  Cleared existing users
   ✓ Created: krunal@example.com
   ✓ Created: admin@alphametrics.in
   ...
🌱 Seed complete!
```

---

## Step 5 — Run the Project

```bash
# Go back to root folder first
cd ..

# Start both frontend + backend together
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Demo Accounts

| Role  | Email                       | Password     |
|-------|-----------------------------|--------------|
| User  | krunal@example.com          | password123  |
| User  | priya@example.com           | password123  |
| User  | rahul@example.com           | password123  |
| Admin | admin@alphametrics.in       | admin123     |

---

## API Endpoints

| Method | Endpoint                        | Auth     | Description                  |
|--------|---------------------------------|----------|------------------------------|
| POST   | /api/auth/signup                | Public   | Register new user            |
| POST   | /api/auth/login                 | Public   | Login, returns JWT           |
| GET    | /api/auth/me                    | User     | Get logged-in user           |
| GET    | /api/stocks                     | User     | All NSE quotes (60s cache)   |
| GET    | /api/stocks/:symbol             | User     | Single stock quote           |
| GET    | /api/stocks/:symbol/history     | User     | Historical candles           |
| GET    | /api/trades                     | User     | User's order history         |
| POST   | /api/trades                     | User     | Execute BUY / SELL           |
| GET    | /api/portfolio                  | User     | User's open positions        |
| GET    | /api/watchlist                  | User     | Get watchlist                |
| POST   | /api/watchlist/:symbol          | User     | Add to watchlist             |
| DELETE | /api/watchlist/:symbol          | User     | Remove from watchlist        |
| GET    | /api/admin/stats                | Admin    | Platform KPIs                |
| GET    | /api/admin/users                | Admin    | All users                    |
| PATCH  | /api/admin/users/:id/status     | Admin    | Activate / deactivate user   |
| GET    | /api/admin/trades               | Admin    | All platform trades          |

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite 5, React Router 6        |
| Charts    | Recharts                                |
| Backend   | Node.js, Express 4                      |
| Database  | MongoDB Atlas + Mongoose                |
| Auth      | JWT (jsonwebtoken) + bcryptjs           |
| Stocks    | yahoo-finance2 (real NSE prices)        |
| Monorepo  | concurrently (single `npm run dev`)     |

---

## Notes

- Yahoo Finance prices are **cached for 60 seconds** to avoid rate limits.
  NSE stocks use the `.NS` suffix (e.g. `RELIANCE.NS`).
- All trades are saved to MongoDB Atlas. Balance and positions persist across sessions and devices.
- The JWT token is stored in `localStorage` under the key `am_token`.
- To reset all user data, re-run `node src/seed.js` in the backend folder.

import express    from "express";
import cors       from "cors";
import dotenv     from "dotenv";
import mongoose   from "mongoose";

import authRoutes      from "./routes/auth.js";
import stockRoutes     from "./routes/stocks.js";
import tradeRoutes     from "./routes/trades.js";
import portfolioRoutes from "./routes/portfolio.js";
import watchlistRoutes from "./routes/watchlist.js";
import adminRoutes     from "./routes/admin.js";
import alertRoutes       from "./routes/alerts.js";
import leaderboardRoutes from "./routes/leaderboard.js";

import Alert          from "./models/Alert.js";
import yahooFinance   from "yahoo-finance2";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/auth",      authRoutes);
app.use("/api/stocks",    stockRoutes);
app.use("/api/trades",    tradeRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/alerts",      alertRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date() }));

// ── Price alert checker — runs every 60 seconds ──────────────────────────────
async function checkAlerts() {
  try {
    const active = await Alert.find({ active: true, triggered: false });
    if (active.length === 0) return;

    // Get unique symbols
    const symbols = [...new Set(active.map((a) => a.symbol))];

    // Fetch prices in parallel
    const prices = {};
    await Promise.allSettled(
      symbols.map(async (sym) => {
        const q = await yahooFinance.quote(`${sym}.NS`);
        prices[sym] = q.regularMarketPrice ?? 0;
      })
    );

    // Check each alert
    for (const alert of active) {
      const price = prices[alert.symbol];
      if (!price) continue;
      const hit =
        (alert.condition === "above" && price >= alert.targetPrice) ||
        (alert.condition === "below" && price <= alert.targetPrice);
      if (hit) {
        alert.triggered      = true;
        alert.triggeredAt    = new Date();
        alert.triggeredPrice = price;
        alert.active         = false;
        await alert.save();
        console.log(`🔔 Alert triggered: ${alert.symbol} ${alert.condition} ₹${alert.targetPrice} (current: ₹${price})`);
      }
    }
  } catch (err) {
    // Silent fail — alert checker is non-critical
  }
}

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
      // Start alert checker
      setInterval(checkAlerts, 60_000);
      console.log("🔔 Price alert checker running (60s interval)");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

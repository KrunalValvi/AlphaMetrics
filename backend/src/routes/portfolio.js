import express from "express";
import Trade    from "../models/Trade.js";
import Position from "../models/Position.js";
import User     from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/portfolio — open positions
router.get("/", protect, async (req, res) => {
  try {
    const positions = await Position.find({ userId: req.user._id });
    res.json(positions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/portfolio/equity?days=30  — real equity curve from trade history
router.get("/equity", protect, async (req, res) => {
  try {
    const days  = Math.min(parseInt(req.query.days) || 30, 365);
    const user  = await User.findById(req.user._id);
    const allTrades = await Trade.find({ userId: req.user._id, status: "EXECUTED" }).sort({ createdAt: 1 });

    const now   = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - days);

    // Replay trades before window to get starting cash
    let dayCash = 1_000_000; // starting balance assumption
    for (const t of allTrades) {
      if (t.createdAt < windowStart) {
        dayCash += t.type === "SELL" ? t.total : -t.total;
      }
    }

    // Group trades in window by date string
    const byDate = {};
    for (const t of allTrades) {
      if (t.createdAt >= windowStart) {
        const d = t.createdAt.toISOString().split("T")[0];
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(t);
      }
    }

    // Build day-by-day curve
    const curve = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      for (const t of byDate[dateStr] || []) {
        dayCash += t.type === "SELL" ? t.total : -t.total;
      }
      curve.push({ date: dateStr, value: Math.max(0, parseFloat(dayCash.toFixed(2))) });
    }

    // If no trades at all, return flat line at current balance
    if (allTrades.length === 0) {
      return res.json(curve.map(p => ({ ...p, value: user.balance })));
    }

    res.json(curve);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

// GET /api/portfolio/stats — day P&L, trade counts
router.get("/stats", protect, async (req, res) => {
  try {
    const user  = await User.findById(req.user._id);
    const today = new Date(); today.setHours(0,0,0,0);

    const todayTrades = await Trade.find({
      userId: req.user._id,
      status: "EXECUTED",
      createdAt: { $gte: today },
    });

    const buyCount  = todayTrades.filter((t) => t.type === "BUY").length;
    const sellCount = todayTrades.filter((t) => t.type === "SELL").length;

    // Day P&L = net cash flow from today's trades
    const dayPnl = todayTrades.reduce((sum, t) => {
      return sum + (t.type === "SELL" ? t.total : -t.total);
    }, 0);

    const allTrades = await Trade.countDocuments({ userId: req.user._id, status: "EXECUTED" });

    res.json({
      dayPnl:      parseFloat(dayPnl.toFixed(2)),
      buyCount,
      sellCount,
      totalTrades: allTrades,
      balance:     user.balance,
      pnl:         user.pnl || 0,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

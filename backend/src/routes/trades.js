import express from "express";
import Trade    from "../models/Trade.js";
import Position from "../models/Position.js";
import User     from "../models/User.js";
import Alert    from "../models/Alert.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/trades — user order history
router.get("/", protect, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(trades);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/trades/export — CSV download
router.get("/export", protect, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const rows = ["Order ID,Symbol,Type,Qty,Price,Total,Status,Date"];
    trades.forEach((t) => {
      rows.push([
        t._id.toString().slice(-8).toUpperCase(),
        t.symbol, t.type, t.qty,
        t.price.toFixed(2), t.total.toFixed(2),
        t.status,
        new Date(t.createdAt).toLocaleDateString("en-IN"),
      ].join(","));
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=trades.csv");
    res.send(rows.join("\n"));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/trades — execute trade
router.post("/", protect, async (req, res) => {
  const { symbol, name, type, qty, price, orderType = "MARKET", sector } = req.body;
  if (!symbol || !type || !qty || !price)
    return res.status(400).json({ message: "symbol, type, qty, price are required" });

  const total = parseFloat((qty * price).toFixed(2));
  const user  = await User.findById(req.user._id);

  try {
    if (type === "BUY") {
      if (user.balance < total)
        return res.status(400).json({ message: "Insufficient funds" });
      user.balance -= total;
      user.balance  = parseFloat(user.balance.toFixed(2));

      const existing = await Position.findOne({ userId: user._id, symbol });
      if (existing) {
        const newTotal   = existing.avgPrice * existing.qty + total;
        existing.qty    += qty;
        existing.avgPrice = parseFloat((newTotal / existing.qty).toFixed(2));
        await existing.save();
      } else {
        await Position.create({ userId: user._id, symbol, name, qty, avgPrice: price, sector: sector || "" });
      }
    } else if (type === "SELL") {
      const position = await Position.findOne({ userId: user._id, symbol });
      if (!position || position.qty < qty)
        return res.status(400).json({ message: `Not enough shares — you hold ${position?.qty ?? 0}` });

      user.balance += total;
      user.balance  = parseFloat(user.balance.toFixed(2));
      position.qty -= qty;

      const pnlOnTrade = parseFloat(((price - position.avgPrice) * qty).toFixed(2));
      user.pnl = parseFloat(((user.pnl || 0) + pnlOnTrade).toFixed(2));

      if (position.qty === 0) await position.deleteOne();
      else await position.save();
    }

    user.trades += 1;
    await user.save();

    // Check if this trade triggered any price alert
    await Alert.updateMany(
      {
        userId: user._id, symbol, active: true, triggered: false,
        $or: [
          { condition: "above", targetPrice: { $lte: price } },
          { condition: "below", targetPrice: { $gte: price } },
        ],
      },
      { triggered: true, triggeredAt: new Date() }
    );

    const trade = await Trade.create({
      userId: user._id, symbol, name, type, qty, price, total, status: "EXECUTED", orderType,
    });

    res.status(201).json({ trade, balance: user.balance });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;

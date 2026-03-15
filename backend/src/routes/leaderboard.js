import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/leaderboard — top traders by P&L, balance, and trade count
router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find({ role: "user", status: "active" })
      .select("name avatarColor balance pnl trades createdAt")
      .sort({ pnl: -1 })
      .limit(20);

    const board = users.map((u, i) => ({
      rank:        i + 1,
      id:          u._id,
      name:        u.name,
      avatarColor: u.avatarColor || "#00d4ff",
      balance:     u.balance,
      pnl:         u.pnl || 0,
      trades:      u.trades || 0,
      joinedDate:  u.createdAt,
      // Badge for top 3
      badge: i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : null,
    }));

    res.json(board);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;

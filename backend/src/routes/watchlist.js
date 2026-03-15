import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/watchlist
router.get("/", protect, async (req, res) => {
  res.json(req.user.watchlist || []);
});

// POST /api/watchlist/:symbol  — add
router.post("/:symbol", protect, async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  if (req.user.watchlist.includes(sym))
    return res.status(409).json({ message: "Already in watchlist" });

  await User.findByIdAndUpdate(req.user._id, { $push: { watchlist: sym } });
  res.json({ watchlist: [...req.user.watchlist, sym] });
});

// DELETE /api/watchlist/:symbol  — remove
router.delete("/:symbol", protect, async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  await User.findByIdAndUpdate(req.user._id, { $pull: { watchlist: sym } });
  res.json({ watchlist: req.user.watchlist.filter((s) => s !== sym) });
});

export default router;

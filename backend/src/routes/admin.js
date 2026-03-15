import express from "express";
import User from "../models/User.js";
import Trade from "../models/Trade.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const totalUsers     = await User.countDocuments({ role: "user" });
    const activeUsers    = await User.countDocuments({ role: "user", status: "active" });
    const totalTrades    = await Trade.countDocuments();
    const volumeResult   = await Trade.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]);
    const totalVolume    = volumeResult[0]?.total || 0;
    const newThisMonth   = await User.countDocuments({
      role: "user",
      createdAt: { $gte: new Date(new Date().setDate(1)) },
    });

    res.json({ totalUsers, activeUsers, totalTrades, totalVolume, newUsersThisMonth: newThisMonth });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/users/:id/status
router.patch("/users/:id/status", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/trades
router.get("/trades", async (req, res) => {
  try {
    const trades = await Trade.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

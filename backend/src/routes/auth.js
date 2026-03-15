import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: makeToken(user._id), user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });
    res.json({ token: makeToken(user._id), user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// PATCH /api/auth/profile — update name, email, password, balance, avatar color
router.patch("/profile", protect, async (req, res) => {
  const { name, email, currentPassword, newPassword, balance, avatarColor } = req.body;
  try {
    const user = await User.findById(req.user._id);

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ message: "Current password is required to set a new password" });
      const ok = await user.matchPassword(currentPassword);
      if (!ok) return res.status(401).json({ message: "Current password is incorrect" });
      user.password = newPassword;
    }

    if (name)  user.name  = name.trim();
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: "Email already in use" });
      user.email = email.toLowerCase();
    }
    // Admin can set balance directly; user can also top-up (simulate deposit)
    if (balance !== undefined && balance !== null) {
      const val = parseFloat(balance);
      if (isNaN(val) || val < 0) return res.status(400).json({ message: "Invalid balance" });
      user.balance = val;
    }
    if (avatarColor) user.avatarColor = avatarColor;

    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-portfolio — wipe all trades & positions, restore balance
router.post("/reset-portfolio", protect, async (req, res) => {
  try {
    const Trade    = (await import("../models/Trade.js")).default;
    const Position = (await import("../models/Position.js")).default;

    await Trade.deleteMany({ userId: req.user._id });
    await Position.deleteMany({ userId: req.user._id });

    const freshBalance = parseFloat(req.body.balance) || 1000000;
    await User.findByIdAndUpdate(req.user._id, { balance: freshBalance, trades: 0, pnl: 0 });

    res.json({ message: "Portfolio reset successfully", balance: freshBalance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

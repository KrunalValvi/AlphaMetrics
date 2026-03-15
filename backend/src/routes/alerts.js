import express from "express";
import Alert from "../models/Alert.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/alerts
router.get("/", protect, async (req, res) => {
  const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(alerts);
});

// POST /api/alerts
router.post("/", protect, async (req, res) => {
  const { symbol, name, targetPrice, condition } = req.body;
  if (!symbol || !targetPrice || !condition)
    return res.status(400).json({ message: "symbol, targetPrice, condition required" });
  const alert = await Alert.create({ userId: req.user._id, symbol, name, targetPrice, condition });
  res.status(201).json(alert);
});

// DELETE /api/alerts/:id
router.delete("/:id", protect, async (req, res) => {
  await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ message: "Deleted" });
});

// PATCH /api/alerts/:id/reset  — reactivate a triggered alert
router.patch("/:id/reset", protect, async (req, res) => {
  const alert = await Alert.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { triggered: false, triggeredAt: null, triggeredPrice: null, active: true },
    { new: true }
  );
  res.json(alert);
});

export default router;

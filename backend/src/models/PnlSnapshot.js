import mongoose from "mongoose";

// Daily portfolio value snapshots — one per user per day
const pnlSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date:   { type: String, required: true },   // "YYYY-MM-DD"
  value:  { type: Number, required: true },   // total portfolio value that day
  cash:   { type: Number, required: true },
}, { timestamps: false });

pnlSchema.index({ userId: 1, date: 1 }, { unique: true });
export default mongoose.model("PnlSnapshot", pnlSchema);

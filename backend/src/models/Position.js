import mongoose from "mongoose";

const positionSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symbol:       { type: String, required: true },
    name:         { type: String },
    qty:          { type: Number, required: true, default: 0 },
    avgPrice:     { type: Number, required: true },
    sector:       { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound unique index: one position doc per user per symbol
positionSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export default mongoose.model("Position", positionSchema);

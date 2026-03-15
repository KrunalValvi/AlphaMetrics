import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symbol:    { type: String, required: true },
    name:      { type: String },
    type:      { type: String, enum: ["BUY", "SELL"], required: true },
    qty:       { type: Number, required: true },
    price:     { type: Number, required: true },
    total:     { type: Number, required: true },
    status:    { type: String, enum: ["EXECUTED", "PENDING", "CANCELLED"], default: "EXECUTED" },
    orderType: { type: String, enum: ["MARKET", "LIMIT"], default: "MARKET" },
  },
  { timestamps: true }
);

export default mongoose.model("Trade", tradeSchema);

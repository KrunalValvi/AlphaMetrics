import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symbol:         { type: String, required: true },
    name:           { type: String, default: "" },
    targetPrice:    { type: Number, required: true },
    condition:      { type: String, enum: ["above", "below"], required: true },
    triggered:      { type: Boolean, default: false },
    triggeredAt:    { type: Date, default: null },
    triggeredPrice: { type: Number, default: null },
    active:         { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);

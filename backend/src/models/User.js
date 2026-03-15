import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true },
    password:    { type: String, required: true },
    role:        { type: String, enum: ["user", "admin"], default: "user" },
    balance:     { type: Number, default: 1000000 },
    status:      { type: String, enum: ["active", "inactive"], default: "active" },
    trades:      { type: Number, default: 0 },
    pnl:         { type: Number, default: 0 },
    watchlist:   [{ type: String }],
    avatarColor: { type: String, default: "#00d4ff" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);

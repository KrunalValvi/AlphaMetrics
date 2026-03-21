// backend/src/seed.js
// Run once: node src/seed.js
// Creates all demo users (hashed passwords) in MongoDB.

import mongoose from "mongoose";
import dotenv   from "dotenv";
import User     from "./models/User.js";

dotenv.config();

const DEMO_USERS = [
  { name: "Krunal Valvi",    email: "krunal@example.com",        password: "password123", role: "user",  balance: 1247832.50, trades: 47,  pnl: 247832.50,   status: "active",   watchlist: ["RELIANCE","TCS","HDFCBANK","INFY"] },
  { name: "Shubham Bhimani", email: "Shubham@example.com",         password: "password123", role: "user",  balance: 876540.00,  trades: 32,  pnl: -123460.00,  status: "active",   watchlist: ["ICICIBANK","WIPRO"] },
  { name: "Vraj Rajarapa",   email: "Vraj@example.com",         password: "password123", role: "user",  balance: 1589200.00, trades: 89,  pnl: 589200.00,   status: "active",   watchlist: ["SBIN","TATAMOTORS"] },
  { name: "Mayur Chavda",    email: "Mayur@example.com",         password: "password123", role: "user",  balance: 543000.00,  trades: 12,  pnl: -457000.00,  status: "inactive", watchlist: [] },
  { name: "Raj Kikani",      email: "Raj@example.com",        password: "password123", role: "user",  balance: 2134500.00, trades: 134, pnl: 1134500.00,  status: "active",   watchlist: ["MARUTI","BAJFINANCE"] },
  { name: "Prit Pansuriya",  email: "Prit@example.com",         password: "password123", role: "user",  balance: 923400.00,  trades: 28,  pnl: -76600.00,   status: "active",   watchlist: ["SUNPHARMA"] },
  { name: "Krish Kachhadiya",  email: "Krish@example.com",         password: "password123", role: "user",  balance: 923400.00,  trades: 28,  pnl: -76600.00,   status: "active",   watchlist: ["SUNPHARMA"] },
  { name: "Admin",           email: "admin@alphametrics.in",     password: "admin123",    role: "admin", balance: 0,          trades: 0,   pnl: 0,           status: "active",   watchlist: [] },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing users
    await User.deleteMany({});
    console.log("🗑  Cleared existing users");

    // Insert all (passwords will be hashed by pre-save hook)
    for (const u of DEMO_USERS) {
      await User.create(u);
      console.log(`   ✓ Created: ${u.email}`);
    }

    console.log("\n🌱 Seed complete! Demo accounts ready.\n");
    console.log("  User:  krunal@example.com  / password123");
    console.log("  Admin: admin@alphametrics.in / admin123\n");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    mongoose.disconnect();
  }
}

seed();

import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { adminAPI } from "../../api/index.js";
import { generatePortfolioHistory } from "../../data/mockData.jsx";

const SECTOR_DATA = [
  { name: "Banking", value: 28, color: "#00d4ff" }, { name: "IT", value: 22, color: "#00ff88" },
  { name: "Energy",  value: 18, color: "#ff6b35" }, { name: "Auto", value: 12, color: "#ffd700" },
  { name: "Pharma",  value: 10, color: "#b44dff" }, { name: "Others", value: 10, color: "#667eea" },
];
const signupData = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  signups: Math.floor(Math.random() * 8 + 1),
  trades:  Math.floor(Math.random() * 60 + 10),
}));
const retentionData = [
  { week: "W1", rate: 92 }, { week: "W2", rate: 85 }, { week: "W3", rate: 79 },
  { week: "W4", rate: 71 }, { week: "W6", rate: 64 }, { week: "W8", rate: 58 },
];
const volumeData = generatePortfolioHistory(60, 10000000);

export default function AdminAnalytics() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    adminAPI.users().then(setUsers).catch(console.error);
  }, []);

  const regularUsers = users.filter((u) => u.role !== "admin");
  const profitable   = regularUsers.filter((u) => (u.pnl || 0) > 0).length;
  const avgTrades    = regularUsers.length > 0 ? Math.round(regularUsers.reduce((s, u) => s + (u.trades || 0), 0) / regularUsers.length) : 0;

  return (
    <AppLayout title="Platform Analytics">
      <div className="page-body" style={{ paddingTop: 24 }}>
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: "Profitable Users",    value: `${profitable}/${regularUsers.length}`, sub: regularUsers.length ? `${((profitable / regularUsers.length) * 100).toFixed(0)}% success rate` : "—", color: "green" },
            { label: "Avg Trades/User",     value: avgTrades,  sub: "All-time",            color: "cyan" },
            { label: "Total Platform P&L",  value: `₹${(regularUsers.reduce((s, u) => s + (u.pnl || 0), 0) / 100000).toFixed(1)}L`, sub: "All user gains", color: "gold" },
            { label: "Avg Session Length",  value: "24 min",   sub: "Per active session",  color: "purple" },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>{s.value}</div>
              <div className="stat-change neutral">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Platform Volume (60d)</div><span className="badge badge-green">+18.4%</span></div>
            <div className="chart-container" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs><linearGradient id="av" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00ff88" stopOpacity={0.15} /><stop offset="95%" stopColor="#00ff88" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Volume"]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="value" stroke="var(--accent-green)" strokeWidth={2} fill="url(#av)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Signups & Trades (2025)</div></div>
            <div className="chart-container" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signupData} barGap={2} barSize={12}>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", paddingTop: 8 }} />
                  <Bar dataKey="signups" name="Signups" fill="var(--accent-cyan)"  radius={[3,3,0,0]} opacity={0.9} />
                  <Bar dataKey="trades"  name="Trades"  fill="var(--accent-green)" radius={[3,3,0,0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">User Retention</div><span className="badge badge-muted">Cohort</span></div>
            <div className="chart-container" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData}>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} domain={[0,100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => [`${v}%`, "Retention"]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="rate" stroke="var(--accent-purple)" strokeWidth={2} dot={{ fill: "var(--accent-purple)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Sector Distribution</div></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={SECTOR_DATA} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={2}>{SECTOR_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                {SECTOR_DATA.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-secondary)" }}>{s.name}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-primary)" }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <div className="card-header"><div className="card-title">Trader Leaderboard</div><span className="badge badge-gold">⭐ Top Performers</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Rank</th><th>Trader</th><th>Balance</th><th>P&L</th><th>Trades</th></tr></thead>
              <tbody>
                {[...regularUsers].sort((a, b) => (b.pnl || 0) - (a.pnl || 0)).map((u, i) => (
                  <tr key={u._id}>
                    <td><span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: i === 0 ? "var(--accent-gold)" : i === 1 ? "var(--text-secondary)" : i === 2 ? "var(--accent-orange)" : "var(--text-muted)" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="sidebar-avatar" style={{ width: 28, height: 28, fontSize: "0.7rem" }}>{u.name?.charAt(0)}</div>
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>₹{(u.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td className={(u.pnl || 0) >= 0 ? "pos" : "neg"} style={{ fontWeight: 500 }}>{(u.pnl || 0) >= 0 ? "+" : ""}₹{Math.abs(u.pnl || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td>{u.trades || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

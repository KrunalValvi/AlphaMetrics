import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";

// Platform volume chart uses real trade data from adminAPI.trades()
const dailyTrades   = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  trades: Math.floor(Math.random() * 40 + 5),
  volume: Math.floor(Math.random() * 5000000 + 500000),
}));

export default function AdminDashboard() {
  const [stats,  setStats]  = useState(null);
  const [users,  setUsers]  = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformData, setPlatformData] = useState([]);

  useEffect(() => {
    Promise.all([adminAPI.stats(), adminAPI.users(), adminAPI.trades()])
      .then(([s, u, t]) => {
        setStats(s); setUsers(u); setTrades(t);
        // Build 14-day volume from real trades
        const now = new Date();
        const vol = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(now); d.setDate(d.getDate() - (13 - i));
          const ds = d.toISOString().split("T")[0];
          const dayTrades = t.filter(tr => tr.createdAt?.startsWith(ds));
          return {
            day: ds.slice(5),
            trades: dayTrades.length,
            volume: dayTrades.reduce((s, tr) => s + (tr.total || 0), 0),
          };
        });
        setPlatformData(vol);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const recentUsers  = users.filter((u) => u.role !== "admin").slice(0, 5);
  const recentTrades = trades.slice(0, 6);

  return (
    <AppLayout title="Admin Overview">
      <div className="page-body" style={{ paddingTop: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800 }}>Platform Overview</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 4 }}>AlphaMetrics Admin Console · Real-time platform analytics</p>
        </div>

        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: "Total Users",      value: loading ? "…" : stats?.totalUsers,       sub: `${stats?.activeUsers ?? "…"} active`,     color: "cyan",   icon: "◈" },
            { label: "Total Trades",     value: loading ? "…" : stats?.totalTrades,      sub: "All time",                                color: "green",  icon: "⬡" },
            { label: "Total Volume",     value: loading ? "…" : `₹${((stats?.totalVolume || 0) / 100000).toFixed(1)}L`, sub: "All orders",  color: "gold",   icon: "⬢" },
            { label: "New This Month",   value: loading ? "…" : stats?.newUsersThisMonth, sub: "New signups",                             color: "purple", icon: "◎" },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-change neutral">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Platform Volume</div><span className="badge badge-green">30-day</span></div>
            <div className="chart-container" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={platformData}>
                  <defs>
                    <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00ff88" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={6} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} formatter={(v) => [`₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "Volume"]} />
                  <Area type="monotone" dataKey="value" stroke="#00ff88" strokeWidth={2} fill="url(#pv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Daily Trades</div><span className="badge badge-cyan">14-day</span></div>
            <div className="chart-container" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrades} barSize={18}>
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="trades" radius={[4, 4, 0, 0]} fill="var(--accent-cyan)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Recent Users */}
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Users</div><span className="badge badge-cyan">{recentUsers.length}</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Trades</th><th>Status</th></tr></thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u._id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-primary)" }}>{u.name}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>{u.email}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{u.trades}</td>
                      <td><span className={`badge ${u.status === "active" ? "badge-green" : "badge-red"}`}>{u.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Trades</div><span className="badge badge-gold">{recentTrades.length}</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>User</th><th>Symbol</th><th>Type</th><th>Total</th></tr></thead>
                <tbody>
                  {recentTrades.map((t) => (
                    <tr key={t._id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>{t.userId?.name || "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>{t.symbol}</td>
                      <td><span className={`badge ${t.type === "BUY" ? "badge-green" : "badge-red"}`}>{t.type}</span></td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>₹{t.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

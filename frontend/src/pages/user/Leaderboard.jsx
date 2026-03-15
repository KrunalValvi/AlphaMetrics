import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Leaderboard() {
  const { user } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState("pnl"); // pnl | balance | trades

  const load = () =>
    adminAPI.users()
      .then((all) => setUsers(all.filter((u) => u.role !== "admin")))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, []);

  const sorted = [...users].sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
  const me = sorted.findIndex((u) => u._id === user?._id);

  const medal = (i) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
  const medalColor = (i) => i === 0 ? "var(--accent-gold)" : i === 1 ? "var(--text-secondary)" : i === 2 ? "var(--accent-orange)" : "var(--text-muted)";

  const totalPnl   = users.reduce((s, u) => s + (u.pnl || 0), 0);
  const profitable = users.filter((u) => (u.pnl || 0) > 0).length;
  const topTrader  = [...users].sort((a, b) => (b.trades || 0) - (a.trades || 0))[0];

  return (
    <AppLayout title="Leaderboard">
      <div className="page-body" style={{ paddingTop: 20 }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.2rem,3vw,1.6rem)", fontWeight: 800 }}>
            🏆 Trader Leaderboard
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.76rem", marginTop: 4 }}>
            Live ranking · refreshes every 30 seconds
          </p>
        </div>

        {/* Platform stats */}
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: "Total Traders",   value: users.length,            color: "cyan",   icon: "◈" },
            { label: "Profitable",      value: `${profitable}/${users.length}`, color: "green", icon: "◎" },
            { label: "Combined P&L",    value: `${totalPnl >= 0 ? "+" : ""}₹${(totalPnl / 100000).toFixed(1)}L`, color: totalPnl >= 0 ? "green" : "red", icon: "⬡" },
            { label: "Most Active",     value: topTrader?.name?.split(" ")[0] || "—", color: "gold", icon: "⬢" },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1rem" }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <div className="card-title">Rankings</div>
              {me >= 0 && <div className="card-subtitle">Your rank: {medal(me)} out of {sorted.length}</div>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["pnl","P&L"],["balance","Balance"],["trades","Trades"]].map(([key, label]) => (
                <button key={key} className={`btn btn-sm ${sort === key ? "btn-primary" : "btn-outline"}`} onClick={() => setSort(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "30px 0", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>Loading rankings…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sorted.map((u, i) => {
                const isMe = u._id === user?._id;
                return (
                  <div key={u._id} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    background: isMe ? "rgba(0,212,255,0.06)" : i < 3 ? "var(--bg-elevated)" : "transparent",
                    border: isMe ? "1px solid rgba(0,212,255,0.25)" : "1px solid var(--border)",
                    transition: "var(--transition)",
                  }}>
                    {/* Rank */}
                    <div style={{ minWidth: 36, fontFamily: "var(--font-mono)", fontSize: i < 3 ? "1.2rem" : "0.82rem", fontWeight: 700, color: medalColor(i), textAlign: "center" }}>
                      {medal(i)}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: u.avatarColor || "var(--accent-cyan)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "#000",
                    }}>
                      {u.name?.charAt(0) || "U"}
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {u.name}
                        </div>
                        {isMe && <span className="badge badge-cyan" style={{ fontSize: "0.6rem" }}>YOU</span>}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>
                        {u.trades || 0} trades · joined {new Date(u.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 24, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: 2 }}>P&L</div>
                        <div className={(u.pnl || 0) >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 600 }}>
                          {(u.pnl || 0) >= 0 ? "+" : ""}₹{Math.abs(u.pnl || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: 2 }}>Balance</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-primary)" }}>
                          ₹{(u.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </div>
                      </div>

                      {/* Mini P&L bar */}
                      <div style={{ width: 60, display: "flex", alignItems: "center" }}>
                        <div style={{ width: "100%", height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 2,
                            width: `${Math.min(100, Math.abs(u.pnl || 0) / 20000)}%`,
                            background: (u.pnl || 0) >= 0 ? "var(--accent-green)" : "var(--accent-red)",
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

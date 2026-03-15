import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";

export default function AdminTrades() {
  const [trades,  setTrades]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("ALL");

  useEffect(() => {
    adminAPI.trades()
      .then(setTrades)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = trades.filter((t) =>
    (filter === "ALL" || t.type === filter) &&
    (t.symbol?.toLowerCase().includes(search.toLowerCase()) ||
     t.userId?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalBuy  = trades.filter((t) => t.type === "BUY").reduce((s, t) => s + t.total, 0);
  const totalSell = trades.filter((t) => t.type === "SELL").reduce((s, t) => s + t.total, 0);

  return (
    <AppLayout title="All Trades">
      <div className="page-body" style={{ paddingTop: 24 }}>
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: "Total Trades", value: trades.length, color: "cyan" },
            { label: "Buy Orders",   value: trades.filter((t) => t.type === "BUY").length,  color: "green" },
            { label: "Sell Orders",  value: trades.filter((t) => t.type === "SELL").length, color: "red" },
            { label: "Total Volume", value: `₹${((totalBuy + totalSell) / 100000).toFixed(1)}L`, color: "gold" },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1.2rem" }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <input type="text" placeholder="Search by symbol or user…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
          <div style={{ display: "flex", gap: 6 }}>
            {["ALL", "BUY", "SELL"].map((f) => (
              <button key={f} className={`btn btn-sm ${filter === f ? (f === "BUY" ? "btn-green" : f === "SELL" ? "btn-red" : "btn-primary") : "btn-outline"}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "auto" }}>{filtered.length} trades</span>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User</th><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>Total</th><th>Date</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7}><div className="empty-state"><p>Loading trades…</p></div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📋</div><p>No trades found.</p></div></td></tr>
                ) : filtered.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-primary)" }}>{t.userId?.name || "—"}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)" }}>{t.userId?.email || ""}</div>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>{t.symbol}</td>
                    <td><span className={`badge ${t.type === "BUY" ? "badge-green" : "badge-red"}`}>{t.type === "BUY" ? "▲" : "▼"} {t.type}</span></td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{t.qty}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>₹{t.price.toLocaleString("en-IN")}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>₹{t.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>{new Date(t.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 14, display: "flex", gap: 28, paddingLeft: 14 }}>
            {[["Buy Volume", `₹${totalBuy.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "pos"], ["Sell Volume", `₹${totalSell.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "neg"]].map(([k, v, cls]) => (
              <div key={k}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 2 }}>{k}</div>
                <div className={`mono ${cls}`} style={{ fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

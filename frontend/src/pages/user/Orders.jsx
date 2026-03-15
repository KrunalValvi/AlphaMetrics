import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { tradesAPI } from "../../api/index.js";

const downloadCSV = async () => {
  try {
    const blob = await tradesAPI.export();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "alphametrics-trades.csv"; a.click();
    URL.revokeObjectURL(url);
  } catch (err) { alert("Export failed: " + err.message); }
};

const STATUS_COLORS = { EXECUTED: "green", PENDING: "gold", CANCELLED: "red" };

export default function Orders() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    tradesAPI.list()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) =>
    (filter === "ALL" || o.status === filter) &&
    (typeFilter === "ALL" || o.type === typeFilter)
  );

  const stats = {
    total:    orders.length,
    executed: orders.filter((o) => o.status === "EXECUTED").length,
    pending:  orders.filter((o) => o.status === "PENDING").length,
    buyVol:   orders.filter((o) => o.type === "BUY").reduce((s, o) => s + o.total, 0),
    sellVol:  orders.filter((o) => o.type === "SELL").reduce((s, o) => s + o.total, 0),
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-IN"),
      time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  return (
    <AppLayout title="Orders">
      <div className="page-body" style={{ paddingTop: 24 }}>
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: "Total Orders", value: stats.total, color: "cyan" },
            { label: "Executed",     value: stats.executed, color: "green" },
            { label: "Pending",      value: stats.pending, color: "gold" },
            { label: "Buy Volume",   value: `₹${stats.buyVol.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "purple" },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1.2rem" }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={() => tradesAPI.exportCSV()}>
            ⬇ Export CSV
          </button>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["ALL", "EXECUTED", "PENDING", "CANCELLED"].map((f) => (
              <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="divider-v" style={{ height: 28 }} />
          <div style={{ display: "flex", gap: 6 }}>
            {["ALL", "BUY", "SELL"].map((f) => (
              <button key={f}
                className={`btn btn-sm ${typeFilter === f ? (f === "BUY" ? "btn-green" : f === "SELL" ? "btn-red" : "btn-primary") : "btn-outline"}`}
                onClick={() => setTypeFilter(f)}>{f}</button>
            ))}
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "auto" }}>
            {filtered.length} orders
          </span>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order ID</th><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>Total</th><th>Status</th><th>Date & Time</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8}><div className="empty-state"><p>Loading orders…</p></div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">📋</div><p>No orders match the selected filters.</p></div></td></tr>
                ) : filtered.map((o) => {
                  const { date, time } = fmtDate(o.createdAt);
                  return (
                    <tr key={o._id}>
                      <td style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", fontSize: "0.7rem" }}>{o._id.slice(-8).toUpperCase()}</td>
                      <td><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>{o.symbol}</span></td>
                      <td><span className={`badge ${o.type === "BUY" ? "badge-green" : "badge-red"}`}>{o.type === "BUY" ? "▲" : "▼"} {o.type}</span></td>
                      <td style={{ color: "var(--text-primary)" }}>{o.qty}</td>
                      <td>₹{o.price.toLocaleString("en-IN")}</td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>₹{o.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                      <td><span className={`badge badge-${STATUS_COLORS[o.status] || "muted"}`}>{o.status === "EXECUTED" ? "✓" : o.status === "PENDING" ? "⟳" : "✕"} {o.status}</span></td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                        <div>{date}</div>
                        <div style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>{time}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 14, display: "flex", gap: 28, paddingLeft: 14 }}>
            {[["Buy Volume", `₹${stats.buyVol.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "pos"], ["Sell Volume", `₹${stats.sellVol.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "neg"], ["Net Flow", `₹${Math.abs(stats.buyVol - stats.sellVol).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "neutral"]].map(([k, v, cls]) => (
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

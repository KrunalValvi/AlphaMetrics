import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import { useNavigate } from "react-router-dom";
import BuySellModal from "../../components/BuySellModal.jsx";
import { portfolioAPI, stocksAPI } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Portfolio() {
  const { balance } = useAuth();
  const navigate = useNavigate();
  const [positions,  setPositions]  = useState([]);
  const [stocks,     setStocks]     = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [tradeType,  setTradeType]  = useState("BUY");
  const [sortBy,     setSortBy]     = useState("value");
  const [loading,    setLoading]    = useState(true);

  const [histData, setHistData] = useState([]);

  const load = () =>
    Promise.all([portfolioAPI.positions(), stocksAPI.all(), portfolioAPI.equity(60)])
      .then(([p, s, eq]) => { setPositions(p); setStocks(s); setHistData(eq); })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const enriched = positions.map((p) => {
    const live = stocks.find((s) => s.symbol === p.symbol);
    const currentPrice = live?.price ?? p.avgPrice;
    const value = currentPrice * p.qty;
    const pnl = (currentPrice - p.avgPrice) * p.qty;
    const pnlPercent = ((currentPrice - p.avgPrice) / p.avgPrice) * 100;
    return { ...p, currentPrice, value, pnl, pnlPercent, sector: live?.sector || p.sector };
  });

  const sorted = [...enriched].sort((a, b) => b[sortBy] - a[sortBy]);
  const totalInvested = enriched.reduce((s, p) => s + p.avgPrice * p.qty, 0);
  const totalValue    = enriched.reduce((s, p) => s + p.value, 0);
  const totalPnl      = totalValue - totalInvested;
  const pnlPct        = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : "0.00";
  const totalPortfolio = totalValue + balance;

  const pnlBars = enriched.map((p) => ({
    name: p.symbol, pnl: parseFloat(p.pnl.toFixed(2)),
    fill: p.pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)",
  }));

  const openModal = (p, type) => {
    const live = stocks.find((s) => s.symbol === p.symbol);
    setSelected(live || { symbol: p.symbol, name: p.name, price: p.currentPrice, sector: p.sector, changePercent: 0, change: 0, high: p.currentPrice, low: p.currentPrice, volume: "N/A" });
    setTradeType(type);
  };

  return (
    <AppLayout title="Portfolio">
      <div className="page-body" style={{ paddingTop: 24 }}>
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: "Total Portfolio",  value: `₹${totalPortfolio.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: "Cash + Positions", color: "cyan" },
            { label: "Invested Value",   value: `₹${totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,  sub: `${enriched.length} positions`,  color: "gold" },
            { label: "Current Value",    value: `₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,     sub: "Mark-to-market",  color: "green" },
            { label: "Unrealized P&L",   value: `${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: `${pnlPct}% return`, color: totalPnl >= 0 ? "green" : "red" },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1rem" }}>{s.value}</div>
              <div className="stat-change neutral">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header">
              <div><div className="card-title">Equity Curve</div><div className="card-subtitle">60-day portfolio value</div></div>
              <span className={`badge ${totalPnl >= 0 ? "badge-green" : "badge-red"}`}>{totalPnl >= 0 ? "+" : ""}{pnlPct}%</span>
            </div>
            <div className="chart-container" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={histData}>
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} formatter={(v) => [`₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "Value"]} />
                  <Area type="monotone" dataKey="value" stroke="var(--accent-cyan)" strokeWidth={2} fill="url(#eq)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div><div className="card-title">P&L by Position</div><div className="card-subtitle">Unrealized gain/loss</div></div>
            </div>
            <div className="chart-container" style={{ height: 180 }}>
              {pnlBars.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pnlBars} barSize={24}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => [`₹${v.toFixed(2)}`, "P&L"]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>{pnlBars.map((b, i) => <Cell key={i} fill={b.fill} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ height: "100%" }}><div className="empty-icon">📊</div><p>No positions yet</p></div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Holdings</div><div className="card-subtitle">{enriched.length} open positions</div></div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: "auto", padding: "4px 10px", fontSize: "0.72rem" }}>
                <option value="value">Value</option>
                <option value="pnl">P&L</option>
                <option value="pnlPercent">P&L %</option>
                <option value="qty">Quantity</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "30px 0", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>Loading portfolio…</div>
          ) : sorted.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💼</div><p>No holdings yet. Buy stocks from the Market page.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Stock</th><th>Qty</th><th>Avg Buy Price</th><th>Current Price</th><th>Invested</th><th>Current Value</th><th>P&L</th><th>P&L %</th><th>Action</th></tr></thead>
                <tbody>
                  {sorted.map((p) => (
                    <tr key={p.symbol}>
                      <td><div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>{p.symbol}</div><div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{p.name}</div></td>
                      <td>{p.qty}</td>
                      <td>₹{p.avgPrice.toFixed(2)}</td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>₹{p.currentPrice.toFixed(2)}</td>
                      <td>₹{(p.avgPrice * p.qty).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                      <td>₹{p.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                      <td className={p.pnl >= 0 ? "pos" : "neg"} style={{ fontWeight: 500 }}>{p.pnl >= 0 ? "+" : ""}₹{p.pnl.toFixed(2)}</td>
                      <td><span className={`badge ${p.pnlPercent >= 0 ? "badge-green" : "badge-red"}`}>{p.pnlPercent >= 0 ? "▲" : "▼"} {Math.abs(p.pnlPercent).toFixed(2)}%</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-green btn-sm" onClick={() => openModal(p, "BUY")}>▲ Buy</button>
                          <button className="btn btn-red btn-sm" onClick={() => openModal(p, "SELL")}>▼ Exit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 14, display: "flex", justifyContent: "flex-end", gap: 20, flexWrap: "wrap" }}>
            {[["Total Invested", `₹${totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "neutral"], ["Total Value", `₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "neutral"], ["Net P&L", `${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, totalPnl >= 0 ? "pos" : "neg"]].map(([k, v, cls]) => (
              <div key={k} style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 2 }}>{k}</div>
                <div className={`mono ${cls}`} style={{ fontSize: "0.9rem", fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <BuySellModal stock={selected} defaultType={tradeType} onClose={() => setSelected(null)} onTradeSuccess={load} />
      )}
    </AppLayout>
  );
}

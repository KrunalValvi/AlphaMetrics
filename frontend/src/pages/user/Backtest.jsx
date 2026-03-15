import AppLayout from "../../components/AppLayout.jsx";
import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { BACKTESTING_STRATEGIES, generateBacktestResult } from "../../data/mockData.jsx";

// Static NSE symbol list for the backtest selector (no API needed — it's a simulator)
const NSE_SYMBOLS = [
  { symbol: "RELIANCE",   name: "Reliance Industries Ltd" },
  { symbol: "TCS",        name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK",   name: "HDFC Bank Ltd" },
  { symbol: "INFY",       name: "Infosys Ltd" },
  { symbol: "ICICIBANK",  name: "ICICI Bank Ltd" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd" },
  { symbol: "WIPRO",      name: "Wipro Ltd" },
  { symbol: "SBIN",       name: "State Bank of India" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd" },
  { symbol: "MARUTI",     name: "Maruti Suzuki India" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd" },
  { symbol: "SUNPHARMA",  name: "Sun Pharmaceutical" },
  { symbol: "LT",         name: "Larsen & Toubro Ltd" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd" },
  { symbol: "NESTLEIND",  name: "Nestle India Ltd" },
];

export default function Backtest() {
  const [form, setForm] = useState({
    strategy: BACKTESTING_STRATEGIES[0],
    symbol: "RELIANCE",
    startDate: "2023-01-01",
    endDate: "2024-01-01",
    capital: 100000,
    stopLoss: 2,
    targetProfit: 4,
  });
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1800));
    setResult(generateBacktestResult(form.strategy, form.symbol, form.startDate, form.endDate, Number(form.capital)));
    setLoading(false);
    setActiveTab("overview");
  };

  const CustomTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-bright)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", color: "var(--accent-cyan)", fontWeight: 600 }}>
          ₹{payload[0]?.value?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Strategy Backtesting">
      <div className="page-body" style={{ paddingTop: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "min(340px, 100%) 1fr", gap: 16, alignItems: "start" }} className="backtest-layout">

          {/* Config Panel */}
          <div className="card" style={{ position: "sticky", top: 76 }}>
            <div className="card-header">
              <div>
                <div className="card-title">⟳ Strategy Config</div>
                <div className="card-subtitle">Configure your backtest parameters</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Strategy</label>
                <select value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}>
                  {BACKTESTING_STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Stock Symbol</label>
                <select value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}>
                  {NSE_SYMBOLS.map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>)}
                </select>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Initial Capital (₹)</label>
                <input type="number" value={form.capital} onChange={(e) => setForm({ ...form, capital: e.target.value })} min={10000} step={10000} />
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Stop Loss (%)</label>
                  <input type="number" value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} min={0.5} max={10} step={0.5} />
                </div>
                <div className="input-group">
                  <label className="input-label">Target Profit (%)</label>
                  <input type="number" value={form.targetProfit} onChange={(e) => setForm({ ...form, targetProfit: e.target.value })} min={1} max={20} step={0.5} />
                </div>
              </div>

              <button className="btn btn-primary btn-lg w-full" onClick={handleRun} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? (<><span className="spinner" style={{ width: 16, height: 16 }} /> Running Simulation...</>) : "⟳ Run Backtest"}
              </button>

              <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--accent-cyan)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Strategy Info</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {form.strategy.includes("SMA")      && "Buys when fast SMA crosses above slow SMA. Sells on cross-under or stop loss."}
                  {form.strategy.includes("EMA")      && "Uses exponential moving averages for faster signal response than SMA."}
                  {form.strategy.includes("RSI")      && "Buys when RSI < 30 (oversold), sells when RSI > 70 (overbought)."}
                  {form.strategy.includes("MACD")     && "Trades on MACD signal line crossovers with histogram confirmation."}
                  {form.strategy.includes("Bollinger")&& "Buys on lower band touch, sells on upper band or middle line."}
                  {form.strategy.includes("Support")  && "Identifies key S/R levels and trades breakouts with volume confirmation."}
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div>
            {!result && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: 20, opacity: 0.3 }}>⟳</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", marginBottom: 8, color: "var(--text-secondary)" }}>Ready to Backtest</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", maxWidth: 320, lineHeight: 1.7 }}>
                  Configure your strategy parameters and click "Run Backtest" to simulate historical performance.
                </p>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20 }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", marginBottom: 6 }}>Simulating {form.strategy}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>Processing historical data for {form.symbol}...</div>
                </div>
              </div>
            )}

            {result && (
              <div className="animate-fade">
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700 }}>{result.strategy}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                        {form.symbol} · {form.startDate} → {form.endDate}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span className={`badge ${parseFloat(result.totalReturn) >= 0 ? "badge-green" : "badge-red"}`} style={{ fontSize: "0.85rem", padding: "6px 16px" }}>
                        {parseFloat(result.totalReturn) >= 0 ? "▲" : "▼"} {Math.abs(result.totalReturn)}% Return
                      </span>
                      <span className="badge badge-cyan" style={{ fontSize: "0.75rem", padding: "6px 14px" }}>
                        {result.winRate}% Win Rate
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid-4" style={{ marginBottom: 16 }}>
                  {[
                    { label: "Total Trades", value: result.trades, color: "cyan" },
                    { label: "Win Rate", value: `${result.winRate}%`, color: parseFloat(result.winRate) >= 50 ? "green" : "red" },
                    { label: "Max Drawdown", value: `-${result.maxDrawdown}%`, color: "red" },
                    { label: "Sharpe Ratio", value: result.sharpe, color: parseFloat(result.sharpe) >= 1 ? "green" : "gold" },
                  ].map((s) => (
                    <div key={s.label} className={`stat-card ${s.color}`}>
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value" style={{ fontSize: "1.3rem" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid-2" style={{ marginBottom: 16 }}>
                  <div className="stat-card cyan">
                    <div className="stat-label">Initial Capital</div>
                    <div className="stat-value" style={{ fontSize: "1rem" }}>₹{Number(form.capital).toLocaleString("en-IN")}</div>
                  </div>
                  <div className={`stat-card ${parseFloat(result.totalReturn) >= 0 ? "green" : "red"}`}>
                    <div className="stat-label">Final Capital</div>
                    <div className="stat-value" style={{ fontSize: "1rem" }}>₹{result.finalCapital.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                    <div className="stat-change">{parseFloat(result.totalReturn) >= 0 ? "+" : ""}{result.totalReturn}% return</div>
                  </div>
                </div>

                <div className="tabs">
                  {["overview", "trades"].map((t) => (
                    <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                      {t === "overview" ? "⟳ Equity Curve" : "◎ Trade Log"}
                    </button>
                  ))}
                </div>

                {activeTab === "overview" && (
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Equity Curve</div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>Capital over backtest period</span>
                    </div>
                    <div className="chart-container" style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.equityCurve}>
                          <defs>
                            <linearGradient id="bt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={parseFloat(result.totalReturn) >= 0 ? "#00ff88" : "#ff3366"} stopOpacity={0.2} />
                              <stop offset="95%" stopColor={parseFloat(result.totalReturn) >= 0 ? "#00ff88" : "#ff3366"} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={10} tickFormatter={(d) => d.slice(5)} />
                          <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                          <Tooltip content={<CustomTip />} />
                          <ReferenceLine y={Number(form.capital)} stroke="var(--text-dim)" strokeDasharray="4 4" />
                          <Area type="monotone" dataKey="value" stroke={parseFloat(result.totalReturn) >= 0 ? "var(--accent-green)" : "var(--accent-red)"} strokeWidth={2} fill="url(#bt)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)", textAlign: "center", marginTop: 6 }}>
                      Dashed line = initial capital (₹{Number(form.capital).toLocaleString("en-IN")})
                    </div>
                  </div>
                )}

                {activeTab === "trades" && (
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Trade Log</div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>{result.trades} trades executed</span>
                    </div>
                    <div className="table-wrap" style={{ maxHeight: 340, overflowY: "auto" }}>
                      <table>
                        <thead><tr><th>#</th><th>Type</th><th>Entry</th><th>Exit</th><th>P&L</th><th>Result</th></tr></thead>
                        <tbody>
                          {result.tradeLog.map((t) => (
                            <tr key={t.id}>
                              <td style={{ color: "var(--text-dim)" }}>{t.id}</td>
                              <td><span className="badge badge-muted" style={{ fontSize: "0.62rem" }}>{t.type}</span></td>
                              <td>₹{t.entryPrice}</td>
                              <td>₹{t.exitPrice}</td>
                              <td className={t.pnl >= 0 ? "pos" : "neg"}>{t.pnl >= 0 ? "+" : ""}₹{t.pnl.toFixed(2)}</td>
                              <td><span className={`badge ${t.result === "WIN" ? "badge-green" : "badge-red"}`}>{t.result}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

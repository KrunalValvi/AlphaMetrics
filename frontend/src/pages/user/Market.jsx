import React, { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import BuySellModal from "../../components/BuySellModal.jsx";
import { stocksAPI } from "../../api/index.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMockStocks, getMockHistory } from "../../data/mockStocks.js";

export default function Market() {
  const { addToWatchlist, dataMode } = useAuth();
  const navigate = useNavigate();
  const [stocks,       setStocks]       = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [tradeType,    setTradeType]    = useState(null);
  const [chartData,    setChartData]    = useState([]);
  const [period,       setPeriod]       = useState("3M");
  const [loading,      setLoading]      = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error,        setError]        = useState("");
  const intervalRef = useRef(null);

  const isMock = dataMode === "mock";

  const loadStocks = useCallback(async () => {
    try {
      if (isMock) {
        const data = getMockStocks();
        setStocks(data);
        if (!selected) setSelected(data[0]);
      } else {
        const data = await stocksAPI.all();
        setStocks(data);
        if (!selected) setSelected(data[0]);
      }
      setError("");
    } catch (err) {
      setError("Failed to load live prices. Try switching to Simulation mode in Settings.");
    } finally {
      setLoading(false);
    }
  }, [isMock]);

  useEffect(() => {
    setLoading(true);
    loadStocks();
    // Mock ticks every 3s, live refreshes every 60s
    intervalRef.current = setInterval(loadStocks, isMock ? 3000 : 60000);
    return () => clearInterval(intervalRef.current);
  }, [isMock, loadStocks]);

  // Chart history
  useEffect(() => {
    if (!selected) return;
    setChartLoading(true);
    if (isMock) {
      setChartData(getMockHistory(selected.symbol, period));
      setChartLoading(false);
    } else {
      stocksAPI.history(selected.symbol, period)
        .then(setChartData)
        .catch(() => setChartData(getMockHistory(selected.symbol, period)))
        .finally(() => setChartLoading(false));
    }
  }, [selected?.symbol, period, isMock]);

  const currentStock = selected ? (stocks.find((s) => s.symbol === selected.symbol) || selected) : null;

  if (loading) return (
    <AppLayout title="Market Overview">
      <div className="page-body" style={{ paddingTop: 40, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "0.8rem" }}>
          {isMock ? "⟳ Loading simulation data…" : "⟳ Fetching live NSE prices from Yahoo Finance…"}
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title="Market Overview">
      <div className="page-body" style={{ paddingTop: 20 }}>
        {/* Mode banner */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
          borderRadius: "var(--radius-md)", marginBottom: 14,
          background: isMock ? "rgba(180,77,255,0.08)" : "rgba(0,255,136,0.06)",
          border: isMock ? "1px solid rgba(180,77,255,0.2)" : "1px solid rgba(0,255,136,0.2)",
        }}>
          <span style={{ fontSize: "0.9rem" }}>{isMock ? "🎮" : "🌐"}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {isMock
              ? "Simulation mode — prices update every 3 seconds. Go to Settings to switch to live data."
              : "Live mode — real NSE prices from Yahoo Finance, refreshed every 60 seconds."}
          </span>
        </div>

        {error && (
          <div style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 16, fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--accent-red)" }}>
            ⚠ {error}
          </div>
        )}

        <div className="market-layout">
          {/* Stock List */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="card-title" style={{ fontSize: "0.82rem" }}>NSE Stocks</div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: isMock ? "var(--accent-purple)" : "var(--accent-green)" }}>
                {isMock ? "⬡ SIM" : "● LIVE"}
              </span>
            </div>
            <div className="market-stock-list-wrap">
              {stocks.map((s) => (
                <div key={s.symbol} onClick={() => setSelected(s)} style={{
                  padding: "10px 14px", cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  background: selected?.symbol === s.symbol ? "var(--bg-elevated)" : "transparent",
                  borderLeft: selected?.symbol === s.symbol ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                  transition: "var(--transition)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", fontWeight: 600, color: "var(--text-primary)" }}>{s.symbol}</div>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 1 }}>{s.sector}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: "var(--text-primary)" }}>₹{s.price.toLocaleString("en-IN")}</div>
                      <div className={s.changePercent >= 0 ? "pos" : "neg"} style={{ fontSize: "0.62rem" }}>
                        {s.changePercent >= 0 ? "▲" : "▼"}{Math.abs(s.changePercent).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          {currentStock && (
            <div style={{ minWidth: 0 }}>
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, cursor:"pointer", color:"var(--accent-cyan)" }} onClick={() => navigate(`/stocks/${currentStock.symbol}`)}>{currentStock.symbol} ↗</h2>
                      <span className="badge badge-cyan">{currentStock.sector}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)" }}>{currentStock.name}</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 700, marginTop: 8 }}>
                      ₹{currentStock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className={currentStock.changePercent >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", marginTop: 2 }}>
                      {currentStock.changePercent >= 0 ? "▲" : "▼"} ₹{Math.abs(currentStock.change).toFixed(2)} ({Math.abs(currentStock.changePercent).toFixed(2)}%)
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-green" onClick={() => setTradeType("BUY")}>▲ Buy</button>
                    <button className="btn btn-red" onClick={() => setTradeType("SELL")}>▼ Sell</button>
                    <button className="btn btn-outline" onClick={() => addToWatchlist(currentStock.symbol)}>＋ Watch</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
                  {[
                    ["Open",    `₹${currentStock.open?.toFixed(2) ?? "—"}`],
                    ["High",    `₹${currentStock.high?.toFixed(2) ?? "—"}`],
                    ["Low",     `₹${currentStock.low?.toFixed(2) ?? "—"}`],
                    ["Volume",  currentStock.volume],
                    ["Mkt Cap", currentStock.marketCap],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: 2 }}>{k}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-primary)" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header" style={{ marginBottom: 12 }}>
                  <div className="card-title">Price Chart</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["1W", "1M", "3M", "1Y"].map((p) => (
                      <button key={p} className={`btn btn-sm ${period === p ? "btn-primary" : "btn-outline"}`} onClick={() => setPeriod(p)}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="chart-container" style={{ height: 220 }}>
                  {chartLoading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>Loading chart…</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" tickFormatter={(d) => d.slice(5)} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`} width={70} />
                        <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} formatter={(v) => [`₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, "Price"]} />
                        <Area type="monotone" dataKey="close" stroke="var(--accent-cyan)" strokeWidth={2} fill="url(#cg)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {tradeType && currentStock && (
        <BuySellModal stock={currentStock} defaultType={tradeType} onClose={() => setTradeType(null)} />
      )}
    </AppLayout>
  );
}

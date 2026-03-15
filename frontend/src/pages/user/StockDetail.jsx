import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import BuySellModal from "../../components/BuySellModal.jsx";
import { stocksAPI, alertsAPI } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMockStocks, getMockHistory } from "../../data/mockStocks.js";

const PERIOD_DAYS = { "1W": 7, "1M": 30, "3M": 90, "1Y": 365 };

export default function StockDetail() {
  const { symbol }    = useParams();
  const navigate      = useNavigate();
  const { addToWatchlist, watchlist, dataMode, showNotification } = useAuth();

  const [stock,     setStock]     = useState(null);
  const [chart,     setChart]     = useState([]);
  const [news,      setNews]      = useState([]);
  const [period,    setPeriod]    = useState("3M");
  const [tradeType, setTradeType] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("chart"); // chart | news | alerts

  // Alert form
  const [alerts,      setAlerts]      = useState([]);
  const [alertPrice,  setAlertPrice]  = useState("");
  const [alertCond,   setAlertCond]   = useState("above");
  const [alertSaving, setAlertSaving] = useState(false);

  const isMock = dataMode === "mock";
  const inWatchlist = watchlist.includes(symbol);

  useEffect(() => {
    const sym = symbol.toUpperCase();
    setLoading(true);

    if (isMock) {
      const all = getMockStocks();
      const s   = all.find((x) => x.symbol === sym) || all[0];
      setStock(s);
      setChart(getMockHistory(sym, period));
      setLoading(false);
    } else {
      Promise.all([
        stocksAPI.one(sym),
        stocksAPI.history(sym, period),
        stocksAPI.news(sym).catch(() => []),
      ]).then(([s, h, n]) => {
        setStock(s);
        setChart(h);
        setNews(n);
      }).catch(() => {
        const all = getMockStocks();
        const s   = all.find((x) => x.symbol === sym) || all[0];
        setStock(s);
        setChart(getMockHistory(sym, period));
        showNotification("Live data unavailable — showing simulation", "info");
      }).finally(() => setLoading(false));
    }
  }, [symbol, isMock]);

  useEffect(() => {
    if (!isMock && stock) {
      stocksAPI.history(symbol.toUpperCase(), period)
        .then(setChart)
        .catch(() => setChart(getMockHistory(symbol.toUpperCase(), period)));
    } else if (stock) {
      setChart(getMockHistory(symbol.toUpperCase(), period));
    }
  }, [period]);

  useEffect(() => {
    alertsAPI.list()
      .then((all) => setAlerts(all.filter((a) => a.symbol === symbol.toUpperCase())))
      .catch(() => {});
  }, [symbol]);

  const createAlert = async () => {
    if (!alertPrice) return;
    setAlertSaving(true);
    try {
      const a = await alertsAPI.create(symbol.toUpperCase(), stock?.name || symbol, parseFloat(alertPrice), alertCond);
      setAlerts((prev) => [a, ...prev]);
      setAlertPrice("");
      showNotification(`Alert set: ${symbol} ${alertCond} ₹${alertPrice}`, "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
    setAlertSaving(false);
  };

  const deleteAlert = async (id) => {
    await alertsAPI.delete(id);
    setAlerts((prev) => prev.filter((a) => a._id !== id));
    showNotification("Alert deleted", "info");
  };

  if (loading || !stock) return (
    <AppLayout title="Stock Detail">
      <div className="page-body" style={{ paddingTop: 40, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>Loading {symbol}…</div>
      </div>
    </AppLayout>
  );

  const priceChange = chart.length > 1 ? chart[chart.length - 1].close - chart[0].close : 0;
  const pctChange   = chart.length > 1 && chart[0].close > 0 ? (priceChange / chart[0].close) * 100 : 0;
  const chartColor  = pctChange >= 0 ? "var(--accent-green)" : "var(--accent-red)";
  const minPrice    = chart.length ? Math.min(...chart.map((c) => c.close || c.value)) : 0;
  const maxPrice    = chart.length ? Math.max(...chart.map((c) => c.close || c.value)) : 0;

  return (
    <AppLayout title={`${stock.symbol} — ${stock.name}`}>
      <div className="page-body" style={{ paddingTop: 20 }}>

        {/* Back button */}
        <button className="btn btn-outline btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* Header card */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800 }}>{stock.symbol}</h1>
                <span className="badge badge-cyan">{stock.sector}</span>
                <span className="badge badge-muted">{stock.exchange || "NSE"}</span>
                {isMock && <span className="badge" style={{ background: "rgba(180,77,255,0.15)", color: "var(--accent-purple)", border: "1px solid rgba(180,77,255,0.3)" }}>SIM</span>}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 10 }}>{stock.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "2.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <span className={stock.changePercent >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
                  {stock.changePercent >= 0 ? "▲" : "▼"} ₹{Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>Today</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignSelf: "flex-start" }}>
              <button className="btn btn-green" onClick={() => setTradeType("BUY")}>▲ Buy</button>
              <button className="btn btn-red" onClick={() => setTradeType("SELL")}>▼ Sell</button>
              <button
                className={`btn ${inWatchlist ? "btn-primary" : "btn-outline"}`}
                onClick={() => inWatchlist ? null : addToWatchlist(stock.symbol)}
              >
                {inWatchlist ? "★ Watching" : "☆ Watch"}
              </button>
            </div>
          </div>

          {/* Key stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 10, marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
            {[
              ["Open",       `₹${stock.open?.toFixed(2) ?? "—"}`],
              ["Prev Close", `₹${stock.prevClose?.toFixed(2) ?? "—"}`],
              ["Day High",   `₹${stock.high?.toFixed(2) ?? "—"}`],
              ["Day Low",    `₹${stock.low?.toFixed(2) ?? "—"}`],
              ["52W High",   stock.week52High ? `₹${stock.week52High.toFixed(2)}` : "—"],
              ["52W Low",    stock.week52Low  ? `₹${stock.week52Low.toFixed(2)}`  : "—"],
              ["Volume",     stock.volume ?? "—"],
              ["Avg Volume", stock.avgVolume ?? "—"],
              ["Market Cap", stock.marketCap ?? "—"],
              ["P/E Ratio",  stock.pe ? stock.pe.toFixed(2) : "—"],
              ["EPS",        stock.eps ? `₹${stock.eps}` : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{k}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 14 }}>
          {["chart", "news", "alerts"].map((t) => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t === "chart" ? "📈 Chart" : t === "news" ? `📰 News${news.length ? ` (${news.length})` : ""}` : `🔔 Alerts${alerts.length ? ` (${alerts.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* CHART TAB */}
        {tab === "chart" && (
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div>
                <div className="card-title">Price History</div>
                <div className="card-subtitle" style={{ color: pctChange >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                  {pctChange >= 0 ? "▲" : "▼"} {Math.abs(pctChange).toFixed(2)}% over period · Range ₹{minPrice.toFixed(0)} – ₹{maxPrice.toFixed(0)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["1W","1M","3M","1Y"].map((p) => (
                  <button key={p} className={`btn btn-sm ${period === p ? "btn-primary" : "btn-outline"}`} onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
            </div>
            <div className="chart-container" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sdg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={chartColor} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`} width={72} domain={["auto","auto"]} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                    formatter={(v, n) => [`₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, "Price"]}
                  />
                  <ReferenceLine y={stock.prevClose} stroke="var(--text-dim)" strokeDasharray="4 4" label={{ value: "Prev close", fill: "var(--text-dim)", fontSize: 10, position: "right" }} />
                  <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} fill="url(#sdg)" dot={false} activeDot={{ r: 4, fill: chartColor }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* NEWS TAB */}
        {tab === "news" && (
          <div className="card">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div className="card-title">Latest News</div>
              {isMock && <span className="badge badge-muted">Not available in simulation mode</span>}
            </div>
            {isMock ? (
              <div className="empty-state">
                <div className="empty-icon">📰</div>
                <p>Switch to Live Data mode in Settings to see real news headlines.</p>
              </div>
            ) : news.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📰</div><p>No recent news found for {symbol}.</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {news.map((n, i) => (
                  <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" style={{
                    display: "block", padding: "14px 0",
                    borderBottom: i < news.length - 1 ? "1px solid var(--border)" : "none",
                    textDecoration: "none", transition: "var(--transition)",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.paddingLeft = "6px"}
                    onMouseLeave={(e) => e.currentTarget.style.paddingLeft = "0"}
                  >
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.5 }}>{n.title}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--accent-cyan)" }}>{n.publisher}</span>
                      {n.time && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)" }}>{new Date(n.time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-dim)", marginLeft: "auto" }}>↗ Open</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ALERTS TAB */}
        {tab === "alerts" && (
          <div className="card">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="card-title">🔔 Price Alerts</div>
                <div className="card-subtitle">Get notified when {symbol} hits your target</div>
              </div>
            </div>

            {/* Create alert */}
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "16px", marginBottom: 20 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 12 }}>
                Current price: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="input-group" style={{ minWidth: 100 }}>
                  <label className="input-label">Condition</label>
                  <select value={alertCond} onChange={(e) => setAlertCond(e.target.value)} style={{ padding: "8px 10px" }}>
                    <option value="above">Price goes above</option>
                    <option value="below">Price goes below</option>
                  </select>
                </div>
                <div className="input-group" style={{ minWidth: 140 }}>
                  <label className="input-label">Target Price (₹)</label>
                  <input type="number" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)}
                    placeholder={stock.price.toFixed(2)} min="0.01" step="0.05" />
                </div>
                <button className="btn btn-primary" onClick={createAlert} disabled={alertSaving || !alertPrice}>
                  {alertSaving ? "Setting…" : "＋ Set Alert"}
                </button>
              </div>
            </div>

            {/* Alert list */}
            {alerts.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔔</div><p>No alerts set for {symbol}. Create one above.</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {alerts.map((a) => (
                  <div key={a._id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: "var(--radius-md)",
                    background: a.triggered ? "rgba(0,255,136,0.05)" : "var(--bg-elevated)",
                    border: a.triggered ? "1px solid rgba(0,255,136,0.2)" : "1px solid var(--border)",
                    flexWrap: "wrap", gap: 10,
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>
                          {a.condition === "above" ? "▲" : "▼"} ₹{a.targetPrice.toLocaleString("en-IN")}
                        </span>
                        <span className={`badge ${a.triggered ? "badge-green" : "badge-cyan"}`}>
                          {a.triggered ? "✓ Triggered" : "● Active"}
                        </span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                        {a.triggered
                          ? `Hit ₹${a.triggeredPrice?.toLocaleString("en-IN")} on ${new Date(a.triggeredAt).toLocaleDateString("en-IN")}`
                          : `Alert when price goes ${a.condition} ₹${a.targetPrice.toLocaleString("en-IN")}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {a.triggered && (
                        <button className="btn btn-sm btn-outline" onClick={() => alertsAPI.reset(a._id).then(() => setAlerts((prev) => prev.map((x) => x._id === a._id ? { ...x, triggered: false, active: true } : x)))}>
                          ↺ Reset
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(255,51,102,0.4)", color: "var(--accent-red)" }} onClick={() => deleteAlert(a._id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {tradeType && (
        <BuySellModal stock={stock} defaultType={tradeType} onClose={() => setTradeType(null)} />
      )}
    </AppLayout>
  );
}

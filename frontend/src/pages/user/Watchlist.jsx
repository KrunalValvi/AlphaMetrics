import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import BuySellModal from "../../components/BuySellModal.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { stocksAPI } from "../../api/index.js";
import { getMockStocks } from "../../data/mockStocks.js";
import { generateCandleData } from "../../data/mockData.jsx";

const MiniChart = ({ symbol, positive }) => {
  const data = generateCandleData(15, 1000).map((d) => ({ v: d.close }));
  return (
    <ResponsiveContainer width={80} height={36}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={positive ? "var(--accent-green)" : "var(--accent-red)"} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default function Watchlist() {
  const { watchlist, addToWatchlist, removeFromWatchlist, dataMode } = useAuth();
  const navigate = useNavigate();
  const [stocks,       setStocks]       = useState([]);
  const [search,       setSearch]       = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStock, setSelected]   = useState(null);
  const [tradeType,    setTradeType]    = useState("BUY");
  const [activeTab,    setActiveTab]    = useState("watchlist");
  const [loading,      setLoading]      = useState(true);
  const searchRef = useRef(null);

  useEffect(() => {
    const load = () => (dataMode === "mock" ? Promise.resolve(getMockStocks()) : stocksAPI.all());
    load().then(setStocks).catch(console.error).finally(() => setLoading(false));
    const iv = setInterval(() => load().then(setStocks).catch(console.error), dataMode === "mock" ? 3000 : 60000);
    return () => clearInterval(iv);
  }, [dataMode]);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.length > 0
    ? stocks.filter((s) => s.symbol.includes(search.toUpperCase()) || s.name?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const watchlistStocks = stocks.filter((s) => watchlist.includes(s.symbol));
  const displayStocks   = activeTab === "watchlist" ? watchlistStocks : stocks;

  const openTrade = (stock, type) => { setSelected(stock); setTradeType(type); };

  return (
    <AppLayout title="Watchlist & Market">
      <div className="page-body" style={{ paddingTop: 24 }}>

        {/* Search bar */}
        <div style={{ marginBottom: 20 }} ref={searchRef}>
          <div style={{ position: "relative", maxWidth: 400 }}>
            <input
              type="text" placeholder="Search stocks to add to watchlist…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => search && setShowDropdown(true)}
              style={{ width: "100%", paddingLeft: 36 }}
            />
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.8rem" }}>⌕</span>

            {showDropdown && filtered.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border-bright)", borderRadius: "var(--radius-md)", zIndex: 100, maxHeight: 220, overflowY: "auto" }}>
                {filtered.map((s) => (
                  <div key={s.symbol}
                    style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}
                    onClick={() => { addToWatchlist(s.symbol); setSearch(""); setShowDropdown(false); }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{s.symbol}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{s.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>₹{s.price.toLocaleString("en-IN")}</div>
                      <div className={s.changePercent >= 0 ? "pos" : "neg"} style={{ fontSize: "0.65rem" }}>{s.changePercent >= 0 ? "▲" : "▼"}{Math.abs(s.changePercent).toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab ${activeTab === "watchlist" ? "active" : ""}`} onClick={() => setActiveTab("watchlist")}>⭐ My Watchlist ({watchlist.length})</button>
          <button className={`tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>All NSE Stocks</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>⟳ Loading live prices…</div>
        ) : displayStocks.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">⭐</div><p>Your watchlist is empty. Search for stocks above to add them.</p></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Symbol</th><th>Price</th><th>Change</th><th>Volume</th><th>52W High/Low</th><th>Trend</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {displayStocks.map((s) => (
                    <tr key={s.symbol}>
                      <td>
                        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent-cyan)", cursor: "pointer" }} onClick={() => navigate(`/stock/${s.symbol}`)}>{s.symbol}</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{s.sector}</div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>₹{s.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td>
                        <div className={s.changePercent >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                          {s.changePercent >= 0 ? "▲" : "▼"} {Math.abs(s.changePercent).toFixed(2)}%
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>{s.change >= 0 ? "+" : ""}₹{s.change.toFixed(2)}</div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)" }}>{s.volume}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem" }}>
                        <span className="pos">₹{s.high?.toFixed(2)}</span>
                        <span style={{ color: "var(--text-muted)" }}> / </span>
                        <span className="neg">₹{s.low?.toFixed(2)}</span>
                      </td>
                      <td><MiniChart symbol={s.symbol} positive={s.changePercent >= 0} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-green btn-sm" onClick={() => openTrade(s, "BUY")}>Buy</button>
                          <button className="btn btn-red btn-sm" onClick={() => openTrade(s, "SELL")}>Sell</button>
                          {activeTab === "watchlist" ? (
                            <button className="btn btn-outline btn-sm" onClick={() => removeFromWatchlist(s.symbol)}>✕</button>
                          ) : (
                            <button className="btn btn-outline btn-sm" onClick={() => addToWatchlist(s.symbol)}>＋</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedStock && (
        <BuySellModal stock={selectedStock} defaultType={tradeType} onClose={() => setSelected(null)} />
      )}
    </AppLayout>
  );
}

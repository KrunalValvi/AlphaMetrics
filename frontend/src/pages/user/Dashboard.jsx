import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { stocksAPI, portfolioAPI } from "../../api/index.js";
import { getMockStocks } from "../../data/mockStocks.js";

const SECTOR_COLORS = {
  Banking:"#00d4ff", IT:"#00ff88", Energy:"#ff6b35", Auto:"#ffd700",
  Pharma:"#b44dff", Telecom:"#ff3366", NBFC:"#00d4ff", Infrastructure:"#00ff88",
  Consumer:"#ff6b35", FMCG:"#ffd700", Other:"#667eea",
};

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border-bright)", borderRadius:"var(--radius-md)", padding:"10px 14px" }}>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.7rem", color:"var(--text-muted)", marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.88rem", color:"var(--accent-green)", fontWeight:600 }}>
        ₹{payload[0]?.value?.toLocaleString("en-IN", { maximumFractionDigits:0 })}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, balance, dataMode } = useAuth();
  const navigate = useNavigate();
  const [stocks,    setStocks]    = useState([]);
  const [positions, setPositions] = useState([]);
  const [equity,    setEquity]    = useState([]);
  const [indices,   setIndices]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const isMock = dataMode === "mock";

  useEffect(() => {
    const loadStocks = isMock ? Promise.resolve(getMockStocks()) : stocksAPI.all();
    const loadIdx    = isMock ? Promise.resolve([]) : stocksAPI.indices().catch(() => []);

    Promise.all([loadStocks, portfolioAPI.positions(), portfolioAPI.equity(30), loadIdx])
      .then(([s, p, eq, idx]) => { setStocks(s); setPositions(p); setEquity(eq); setIndices(idx); })
      .catch(console.error)
      .finally(() => setLoading(false));

    const iv = setInterval(() => {
      (isMock ? Promise.resolve(getMockStocks()) : stocksAPI.all()).then(setStocks).catch(console.error);
    }, isMock ? 3000 : 60000);
    return () => clearInterval(iv);
  }, [isMock]);

  const enriched = positions.map((p) => {
    const live = stocks.find((s) => s.symbol === p.symbol);
    const currentPrice = live?.price ?? p.avgPrice;
    const value = currentPrice * p.qty;
    const pnl   = (currentPrice - p.avgPrice) * p.qty;
    const pnlPercent = ((currentPrice - p.avgPrice) / p.avgPrice) * 100;
    return { ...p, currentPrice, value, pnl, pnlPercent };
  });

  const totalInvested = enriched.reduce((s, p) => s + p.avgPrice * p.qty, 0);
  const totalValue    = enriched.reduce((s, p) => s + p.value, 0);
  const totalPnl      = enriched.reduce((s, p) => s + p.pnl, 0);
  const pnlPercent    = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : "0.00";

  // Real day P&L from equity curve
  const dayPnl = equity.length >= 2
    ? equity[equity.length - 1].value - equity[equity.length - 2].value
    : 0;

  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  const losers  = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);

  // Sector allocation from real positions
  const sectorMap = {};
  enriched.forEach((p) => { const s = p.sector || "Other"; sectorMap[s] = (sectorMap[s] || 0) + p.value; });
  const totalPos  = Object.values(sectorMap).reduce((a, b) => a + b, 0) || 1;
  const sectorData = Object.entries(sectorMap).map(([name, val]) => ({
    name, value: parseFloat(((val / totalPos) * 100).toFixed(1)), color: SECTOR_COLORS[name] || "#667eea",
  }));

  // Static NIFTY fallback if market closed
  const displayIndices = indices.length > 0 ? indices : [
    { name: "NIFTY 50",   value: "—", changePercent: 0 },
    { name: "SENSEX",     value: "—", changePercent: 0 },
    { name: "NIFTY BANK", value: "—", changePercent: 0 },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="page-body" style={{ paddingTop: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.2rem,3vw,1.6rem)", fontWeight:800 }}>
            Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color:"var(--text-muted)", fontSize:"0.76rem", marginTop:4 }}>
            {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
            {isMock ? " · Simulation mode" : " · Live NSE data"}
          </p>
        </div>

        {/* Indices strip */}
        <div className="grid-4" style={{ marginBottom:16 }}>
          {displayIndices.map((idx) => (
            <div key={idx.name} className="card" style={{ padding:"12px 14px" }}>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"var(--text-muted)", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.1em" }}>{idx.name}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:"1rem", fontWeight:600, color:"var(--text-primary)", marginBottom:2 }}>
                {typeof idx.value === "number" ? idx.value.toLocaleString("en-IN") : idx.value}
              </div>
              {typeof idx.changePercent === "number" && idx.value !== "—" && (
                <div className={idx.changePercent >= 0 ? "pos" : "neg"} style={{ fontFamily:"var(--font-mono)", fontSize:"0.7rem" }}>
                  {idx.changePercent >= 0 ? "▲" : "▼"} {Math.abs(idx.changePercent).toFixed(2)}%
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid-4" style={{ marginBottom:16 }}>
          {[
            { label:"Portfolio Value", value:`₹${totalValue.toLocaleString("en-IN",{maximumFractionDigits:0})}`,  change:`${pnlPercent >= 0 ? "+" : ""}${pnlPercent}%`,          color:"green",                      icon:"◎" },
            { label:"Total P&L",      value:`₹${totalPnl.toLocaleString("en-IN",{maximumFractionDigits:0})}`,    change:`${totalPnl >= 0 ? "+" : ""}${pnlPercent}%`,             color:totalPnl >= 0 ? "green":"red", icon:"⬡" },
            { label:"Day's P&L",      value:`${dayPnl >= 0 ? "+" : ""}₹${Math.abs(dayPnl).toLocaleString("en-IN",{maximumFractionDigits:0})}`, change:"vs yesterday", color:dayPnl >= 0 ? "cyan":"red", icon:"◈" },
            { label:"Available Cash", value:`₹${balance.toLocaleString("en-IN",{maximumFractionDigits:0})}`,     change:`${enriched.length} positions`,                          color:"gold",                       icon:"⬢" },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className={`stat-change ${s.color==="red"?"neg":s.color==="green"?"pos":"neutral"}`}>{s.change}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid-2" style={{ marginBottom:16 }}>
          {/* Real equity curve */}
          <div className="card">
            <div className="card-header">
              <div><div className="card-title">Portfolio Performance</div><div className="card-subtitle">30-day equity (real trades)</div></div>
              <span className={`badge ${totalPnl >= 0 ? "badge-green" : "badge-red"}`}>{totalPnl >= 0 ? "+" : ""}{pnlPercent}%</span>
            </div>
            <div className="chart-container" style={{ height:200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equity} margin={{ top:5, right:5, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00ff88" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize:10, fill:"var(--text-muted)" }} tickLine={false} axisLine={false} interval={6} tickFormatter={(d)=>d.slice(5)} />
                  <YAxis tick={{ fontSize:10, fill:"var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v)=>`${(v/100000).toFixed(0)}L`} />
                  <Tooltip content={<Tip />} />
                  <Area type="monotone" dataKey="value" stroke="#00ff88" strokeWidth={2} fill="url(#pg)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sector allocation */}
          <div className="card">
            <div className="card-header">
              <div><div className="card-title">Sector Allocation</div><div className="card-subtitle">Portfolio distribution</div></div>
            </div>
            {sectorData.length > 0 ? (
              <div className="sector-allocation-inner">
                <div className="sector-pie-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sectorData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={3}>
                        {sectorData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:8, fontSize:11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  {sectorData.map((s) => (
                    <div key={s.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:s.color, flexShrink:0 }} />
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.7rem", color:"var(--text-secondary)" }}>{s.name}</span>
                      </div>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.7rem", color:"var(--text-primary)", marginLeft:6 }}>{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state"><div className="empty-icon">📊</div><p>Buy stocks to see your sector allocation.</p></div>
            )}
          </div>
        </div>

        {/* Gainers / Losers */}
        <div className="grid-2" style={{ marginBottom:16 }}>
          {[{ title:"Top Gainers", data:gainers, isGain:true },{ title:"Top Losers", data:losers, isGain:false }].map(({ title, data, isGain }) => (
            <div key={title} className="card">
              <div className="card-header">
                <div className="card-title">{title}</div>
                <span className={`badge ${isGain ? "badge-green" : "badge-red"}`}>{isGain ? "▲ NSE" : "▼ NSE"}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {data.map((s) => (
                  <div key={s.symbol}
                    onClick={() => navigate(`/stocks/${s.symbol}`)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", background:"var(--bg-elevated)", borderRadius:"var(--radius-md)", border:"1px solid var(--border)", cursor:"pointer", transition:"var(--transition)" }}
                  >
                    <div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.76rem", fontWeight:600, color:"var(--text-primary)" }}>{s.symbol}</div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"var(--text-muted)" }}>{s.sector}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.8rem" }}>₹{s.price.toLocaleString("en-IN")}</div>
                      <div className={s.changePercent >= 0 ? "pos" : "neg"} style={{ fontSize:"0.7rem" }}>{s.changePercent >= 0 ? "▲" : "▼"}{Math.abs(s.changePercent).toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Positions table */}
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Open Positions</div><div className="card-subtitle">{enriched.length} active positions</div></div>
            <span className="badge badge-cyan">{enriched.length} Positions</span>
          </div>
          {loading ? (
            <div style={{ textAlign:"center", padding:"20px 0", fontFamily:"var(--font-mono)", fontSize:"0.75rem", color:"var(--text-muted)" }}>Loading…</div>
          ) : enriched.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📈</div><p>No open positions. Go to Market to buy your first stock.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Symbol</th><th>Qty</th><th>Avg Price</th><th>LTP</th><th>Value</th><th>P&L</th><th>P&L %</th></tr></thead>
                <tbody>
                  {enriched.map((p) => (
                    <tr key={p.symbol} onClick={() => navigate(`/stocks/${p.symbol}`)} style={{ cursor:"pointer" }}>
                      <td><div className="stock-name-cell"><div className="stock-symbol">{p.symbol}</div><div style={{ fontSize:"0.62rem", color:"var(--text-muted)" }}>{p.name}</div></div></td>
                      <td>{p.qty}</td>
                      <td>₹{p.avgPrice.toFixed(2)}</td>
                      <td className="price-cell">₹{p.currentPrice.toFixed(2)}</td>
                      <td>₹{p.value.toLocaleString("en-IN",{maximumFractionDigits:0})}</td>
                      <td className={p.pnl >= 0 ? "pos" : "neg"}>{p.pnl >= 0 ? "+" : ""}₹{p.pnl.toFixed(2)}</td>
                      <td className={p.pnlPercent >= 0 ? "pos" : "neg"}>{p.pnlPercent >= 0 ? "▲" : "▼"} {Math.abs(p.pnlPercent).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

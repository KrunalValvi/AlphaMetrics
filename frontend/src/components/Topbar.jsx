import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { stocksAPI } from "../api/index.js";

export default function Topbar({ title, onMenuClick }) {
  const { user, balance, notification, dataMode } = useAuth();
  const [time,        setTime]        = useState(new Date());
  const [marketOpen,  setMarketOpen]  = useState(false);
  const [tickerItems, setTickerItems] = useState([]);

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setTime(now);
      // IST: UTC+5:30 → market 9:15–15:30 Mon–Fri
      const utcH = now.getUTCHours(), utcM = now.getUTCMinutes();
      const istMins = utcH * 60 + utcM + 330;
      const dayMins = istMins % (24*60);
      const day = now.getUTCDay();
      const isWeekday = day >= 1 && day <= 5;
      setMarketOpen(isWeekday && dayMins >= 555 && dayMins <= 930);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadTicker = async () => {
      try {
        const [stocks, indices] = await Promise.all([
          stocksAPI.all().catch(() => []),
          dataMode === "live" ? stocksAPI.indices().catch(() => []) : Promise.resolve([]),
        ]);
        const idxItems = indices.map((i) => ({ symbol: i.name, price: i.value, changePercent: i.changePercent }));
        const stkItems = stocks.slice(0, 8).map((s) => ({ symbol: s.symbol, price: s.price, changePercent: s.changePercent }));
        setTickerItems([...idxItems, ...stkItems]);
      } catch {}
    };
    loadTicker();
    const iv = setInterval(loadTicker, dataMode === "mock" ? 5000 : 60000);
    return () => clearInterval(iv);
  }, [user, dataMode]);

  const fmt = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const items = tickerItems.length ? tickerItems : [
    { symbol:"NIFTY 50",   price:22456.80, changePercent:0.55 },
    { symbol:"SENSEX",     price:73876.00, changePercent:0.56 },
    { symbol:"RELIANCE",   price:2847.35,  changePercent:1.50 },
    { symbol:"TCS",        price:3921.50,  changePercent:-0.73 },
    { symbol:"HDFCBANK",   price:1678.90,  changePercent:1.42 },
  ];

  return (
    <>
      <div className="ticker-tape">
        <div className="ticker-inner">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-symbol">{item.symbol}</span>
              <span className="ticker-price">₹{fmt(item.price || 0)}</span>
              <span className={(item.changePercent ?? 0) >= 0 ? "pos" : "neg"}>
                {(item.changePercent ?? 0) >= 0 ? "▲" : "▼"}{Math.abs(item.changePercent ?? 0).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="topbar">
        <div className="topbar-left">
          <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">☰</button>
          <h2 className="topbar-title">{title}</h2>
        </div>
        <div className="topbar-right">
          <div className="market-status-pill">
            <span className="live-dot" style={{ background: marketOpen ? "var(--accent-green)" : "var(--accent-red)" }}/>
            <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.68rem",color:"var(--text-secondary)" }}>
              NSE {marketOpen ? "LIVE" : "CLOSED"}
            </span>
          </div>
          <div className="topbar-time">
            {time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
          </div>
          {user?.role !== "admin" && (
            <div className="balance-display">
              <div className="balance-label">Balance</div>
              <div className="balance-value">₹{fmt(balance)}</div>
            </div>
          )}
          <div className="sidebar-avatar" style={{ width:32,height:32,fontSize:"0.78rem",background:user?.avatarColor||"var(--accent-cyan)" }}>
            {user?.name?.charAt(0)||"U"}
          </div>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`} key={notification.id}>
          <span>{notification.type==="success"?"✓":notification.type==="error"?"✕":"ℹ"}</span>
          {notification.message}
        </div>
      )}
    </>
  );
}

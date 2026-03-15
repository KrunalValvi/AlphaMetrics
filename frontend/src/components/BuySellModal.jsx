import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function BuySellModal({ stock, defaultType = "BUY", onClose, onTradeSuccess }) {
  const { balance, executeTrade } = useAuth();
  const [type,       setType]       = useState(defaultType);
  const [qty,        setQty]        = useState(1);
  const [orderType,  setOrderType]  = useState("MARKET");
  const [limitPrice, setLimitPrice] = useState(stock?.price || 0);
  const [submitting, setSubmitting] = useState(false);

  const execPrice = orderType === "MARKET" ? stock?.price : limitPrice;
  const total     = qty * execPrice;
  const canAfford = type === "BUY" ? total <= balance : true;

  const handleSubmit = async () => {
    if (!canAfford) return;
    setSubmitting(true);
    const success = await executeTrade(
      stock.symbol, type, parseInt(qty), execPrice,
      stock.name || stock.symbol, orderType, stock.sector || ""
    );
    setSubmitting(false);
    if (success) {
      if (onTradeSuccess) onTradeSuccess();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>{stock?.symbol}</h3>
            <span className="badge badge-cyan">{stock?.sector}</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{stock?.name}</div>
        </div>

        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", fontWeight: 600 }}>
              ₹{stock?.price?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }} className={stock?.changePercent >= 0 ? "pos" : "neg"}>
              {stock?.changePercent >= 0 ? "▲" : "▼"} {Math.abs(stock?.changePercent ?? 0).toFixed(2)}%
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 2 }}>H: ₹{stock?.high?.toFixed(2)} / L: ₹{stock?.low?.toFixed(2)}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Vol: {stock?.volume}</div>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab ${type === "BUY" ? "active" : ""}`} onClick={() => setType("BUY")} style={{ color: type === "BUY" ? "var(--accent-green)" : undefined }}>▲ BUY</button>
          <button className={`tab ${type === "SELL" ? "active" : ""}`} onClick={() => setType("SELL")} style={{ color: type === "SELL" ? "var(--accent-red)" : undefined }}>▼ SELL</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Order Type</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["MARKET", "LIMIT"].map((o) => (
                <button key={o} className={`btn btn-sm ${orderType === o ? "btn-primary" : "btn-outline"}`} onClick={() => setOrderType(o)}>{o}</button>
              ))}
            </div>
          </div>

          {orderType === "LIMIT" && (
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Limit Price (₹)</label>
              <input type="number" value={limitPrice} onChange={(e) => setLimitPrice(parseFloat(e.target.value))} min="0.01" step="0.05" style={{ width: "100%" }} />
            </div>
          )}

          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Quantity</label>
            <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} min="1" style={{ width: "100%" }} />
          </div>

          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>Order Value</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>Available Balance</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: canAfford ? "var(--accent-green)" : "var(--accent-red)" }}>₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {!canAfford && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--accent-red)", textAlign: "center" }}>⚠ Insufficient funds</div>
          )}

          <button
            className={`btn ${type === "BUY" ? "btn-green" : "btn-red"}`}
            style={{ width: "100%", padding: "12px", fontSize: "0.85rem" }}
            onClick={handleSubmit}
            disabled={!canAfford || submitting}
          >
            {submitting ? "Placing order…" : `${type === "BUY" ? "▲ Buy" : "▼ Sell"} ${qty} × ${stock?.symbol}`}
          </button>
        </div>
      </div>
    </div>
  );
}

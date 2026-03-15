import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { alertsAPI } from "../../api/index.js";

const NSE_SYMBOLS = [
  "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK",
  "BHARTIARTL","WIPRO","SBIN","TATAMOTORS","MARUTI",
  "BAJFINANCE","SUNPHARMA","LT","ASIANPAINT","NESTLEIND",
];

export default function Alerts() {
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [symbol,    setSymbol]    = useState("RELIANCE");
  const [price,     setPrice]     = useState("");
  const [condition, setCondition] = useState("above");
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState("");

  const load = () =>
    alertsAPI.list()
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!price) return setMsg("Enter a target price");
    setSaving(true); setMsg("");
    try {
      await alertsAPI.create(symbol, symbol, parseFloat(price), condition);
      setMsg("✓ Alert created!"); setPrice("");
      load();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) { setMsg("✕ " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await alertsAPI.delete(id).catch(console.error);
    setAlerts((prev) => prev.filter((a) => a._id !== id));
  };

  const handleDismiss = async (id) => {
    await alertsAPI.dismiss(id).catch(console.error);
    setAlerts((prev) => prev.map((a) => a._id === id ? { ...a, active: false } : a));
  };

  const active    = alerts.filter((a) => a.active && !a.triggered);
  const triggered = alerts.filter((a) => a.triggered);
  const inactive  = alerts.filter((a) => !a.active && !a.triggered);

  return (
    <AppLayout title="Price Alerts">
      <div className="page-body" style={{ paddingTop:24 }}>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 340px",gap:16,alignItems:"start" }} className="backtest-layout">

          {/* Alert list */}
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

            {/* Triggered alerts */}
            {triggered.length > 0 && (
              <div className="card" style={{ border:"1px solid rgba(255,215,0,0.3)" }}>
                <div className="card-header" style={{ marginBottom:14 }}>
                  <div className="card-title" style={{ color:"var(--accent-gold)" }}>🔔 Triggered Alerts</div>
                  <span className="badge badge-gold">{triggered.length}</span>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {triggered.map((a) => (
                    <div key={a._id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"12px 14px",background:"rgba(255,215,0,0.06)",border:"1px solid rgba(255,215,0,0.2)",
                      borderRadius:"var(--radius-md)" }}>
                      <div>
                        <div style={{ fontFamily:"var(--font-mono)",fontSize:"0.8rem",fontWeight:600,color:"var(--text-primary)",marginBottom:2 }}>
                          {a.symbol} — Price {a.condition} ₹{a.targetPrice.toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontFamily:"var(--font-mono)",fontSize:"0.65rem",color:"var(--text-muted)" }}>
                          Triggered {a.triggeredAt ? new Date(a.triggeredAt).toLocaleString("en-IN") : ""}
                        </div>
                      </div>
                      <div style={{ display:"flex",gap:6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => handleDismiss(a._id)}>Dismiss</button>
                        <button className="btn btn-sm btn-outline" style={{ color:"var(--accent-red)" }} onClick={() => handleDelete(a._id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active alerts */}
            <div className="card">
              <div className="card-header" style={{ marginBottom:14 }}>
                <div><div className="card-title">Active Alerts</div><div className="card-subtitle">Monitoring in real time</div></div>
                <span className="badge badge-green">{active.length} active</span>
              </div>
              {loading ? (
                <div style={{ fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--text-muted)",padding:"20px 0",textAlign:"center" }}>Loading…</div>
              ) : active.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🔔</div><p>No active alerts. Create one using the form →</p></div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {active.map((a) => (
                    <div key={a._id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"12px 14px",background:"var(--bg-elevated)",border:"1px solid var(--border)",
                      borderRadius:"var(--radius-md)" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                        <div style={{ width:8,height:8,borderRadius:"50%",background:"var(--accent-green)",
                          boxShadow:"0 0 6px var(--accent-green)",flexShrink:0 }}/>
                        <div>
                          <div style={{ fontFamily:"var(--font-mono)",fontSize:"0.8rem",fontWeight:600,color:"var(--text-primary)",marginBottom:2 }}>
                            <span style={{ color:"var(--accent-cyan)" }}>{a.symbol}</span>
                            {" "}{a.condition === "above" ? "↑ above" : "↓ below"}{" "}
                            <span style={{ color:"var(--accent-gold)" }}>₹{a.targetPrice.toLocaleString("en-IN")}</span>
                          </div>
                          <div style={{ fontFamily:"var(--font-mono)",fontSize:"0.62rem",color:"var(--text-muted)" }}>
                            Set {new Date(a.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </div>
                      </div>
                      <button className="btn btn-sm btn-outline" style={{ color:"var(--accent-red)" }} onClick={() => handleDelete(a._id)}>✕ Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past / dismissed */}
            {inactive.length > 0 && (
              <div className="card">
                <div className="card-header" style={{ marginBottom:14 }}>
                  <div className="card-title" style={{ opacity:0.6 }}>Past Alerts</div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {inactive.map((a) => (
                    <div key={a._id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"10px 12px",opacity:0.45,background:"var(--bg-elevated)",borderRadius:"var(--radius-md)" }}>
                      <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.72rem" }}>
                        {a.symbol} {a.condition} ₹{a.targetPrice.toLocaleString("en-IN")}
                      </span>
                      <button className="btn btn-sm btn-outline" onClick={() => handleDelete(a._id)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Create form */}
          <div className="card" style={{ position:"sticky",top:76 }}>
            <div className="card-header" style={{ marginBottom:20 }}>
              <div><div className="card-title">🔔 New Alert</div><div className="card-subtitle">Set a price target</div></div>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div className="input-group">
                <label className="input-label">Stock Symbol</label>
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                  {NSE_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Condition</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="above">Price goes ABOVE target</option>
                  <option value="below">Price goes BELOW target</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Target Price (₹)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 3000" step="0.05" min="0"/>
              </div>
              {msg && (
                <div style={{ fontFamily:"var(--font-mono)",fontSize:"0.72rem",padding:"8px 12px",borderRadius:"var(--radius-md)",
                  background: msg.startsWith("✓") ? "rgba(0,255,136,0.08)" : "rgba(255,51,102,0.08)",
                  color: msg.startsWith("✓") ? "var(--accent-green)" : "var(--accent-red)",
                  border: `1px solid ${msg.startsWith("✓") ? "rgba(0,255,136,0.2)" : "rgba(255,51,102,0.2)"}`,
                }}>{msg}</div>
              )}
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "🔔 Create Alert"}
              </button>
              <div style={{ fontFamily:"var(--font-mono)",fontSize:"0.65rem",color:"var(--text-dim)",lineHeight:1.6 }}>
                Alerts are checked every time you execute a trade. In live mode they can also be triggered by background checks.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

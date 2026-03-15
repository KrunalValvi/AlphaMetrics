import React, { useState } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const AVATAR_COLORS = [
  "#00d4ff","#00ff88","#b44dff","#ffd700","#ff6b35","#ff3366",
  "#667eea","#f093fb","#4facfe","#43e97b",
];

const Toggle = ({ val, onToggle, size = "md" }) => {
  const w = size === "lg" ? 56 : 44;
  const h = size === "lg" ? 30 : 24;
  const d = size === "lg" ? 22 : 18;
  return (
    <div onClick={onToggle} style={{
      width: w, height: h, borderRadius: h / 2, cursor: "pointer",
      transition: "var(--transition)",
      background: val ? "var(--accent-green)" : "var(--bg-elevated)",
      border: val ? "1px solid var(--accent-green)" : "1px solid var(--border)",
      position: "relative", flexShrink: 0,
    }}>
      <div style={{
        width: d, height: d, borderRadius: "50%", background: "white",
        position: "absolute", top: (h - d) / 2, transition: "var(--transition)",
        left: val ? w - d - (h - d) / 2 : (h - d) / 2,
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
};

const Section = ({ title, subtitle, children, accent }) => (
  <div className="card" style={{ marginBottom: 16, ...(accent ? { border: `1px solid ${accent}33` } : {}) }}>
    {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: "12px 12px 0 0" }} />}
    <div className="card-header" style={{ marginBottom: 20 }}>
      <div>
        <div className="card-title" style={accent ? { color: accent } : {}}>{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
    </div>
    {children}
  </div>
);

export default function UserSettings() {
  const { user, balance, dataMode, toggleDataMode, setDataModeDirectly, updateProfile, resetPortfolio, showNotification } = useAuth();

  // Profile form
  const [name,     setName]     = useState(user?.name  || "");
  const [email,    setEmail]    = useState(user?.email || "");
  const [curPass,  setCurPass]  = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confPass, setConfPass] = useState("");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#00d4ff");
  const [saving,   setSaving]   = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Balance / portfolio
  const [topUpAmount,    setTopUpAmount]    = useState(500000);
  const [resetBalance,   setResetBalance]   = useState(1000000);
  const [confirmReset,   setConfirmReset]   = useState(false);
  const [confirmWipe,    setConfirmWipe]    = useState(false);

  // Prefs
  const [notifications, setNotifications]  = useState(true);
  const [soundFX,       setSoundFX]        = useState(false);
  const [compactMode,   setCompactMode]    = useState(false);

  const handleProfileSave = async () => {
    if (newPass && newPass !== confPass) {
      setProfileMsg("New passwords do not match");
      return;
    }
    if (newPass && newPass.length < 6) {
      setProfileMsg("New password must be at least 6 characters");
      return;
    }
    setSaving(true);
    setProfileMsg("");
    const payload = { name, email, avatarColor };
    if (newPass) { payload.currentPassword = curPass; payload.newPassword = newPass; }
    const result = await updateProfile(payload);
    setSaving(false);
    if (result.success) {
      setProfileMsg("✓ Profile saved successfully!");
      setCurPass(""); setNewPass(""); setConfPass("");
    } else {
      setProfileMsg("✕ " + result.error);
    }
  };

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) return showNotification("Enter a valid amount", "error");
    const newBal = balance + amt;
    const result = await updateProfile({ balance: newBal });
    if (result.success) showNotification(`₹${amt.toLocaleString("en-IN")} added to your account!`, "success");
  };

  const handleSetBalance = async (val) => {
    const amt = parseFloat(val);
    if (isNaN(amt) || amt < 0) return showNotification("Invalid amount", "error");
    const result = await updateProfile({ balance: amt });
    if (result.success) showNotification(`Balance set to ₹${amt.toLocaleString("en-IN")}`, "success");
  };

  const handleResetPortfolio = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    await resetPortfolio(resetBalance);
    setConfirmReset(false);
  };

  const handleWipeAll = async () => {
    if (!confirmWipe) { setConfirmWipe(true); return; }
    await resetPortfolio(1000000);
    setConfirmWipe(false);
  };

  const QUICK_BALANCES = [500000, 1000000, 2000000, 5000000, 10000000];

  return (
    <AppLayout title="Settings">
      <div className="page-body" style={{ paddingTop: 24 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* ── DATA MODE TOGGLE (most prominent) ── */}
          <div className="card" style={{
            marginBottom: 20,
            background: dataMode === "live"
              ? "linear-gradient(135deg, rgba(0,255,136,0.07), rgba(0,212,255,0.04))"
              : "linear-gradient(135deg, rgba(180,77,255,0.07), rgba(255,107,53,0.04))",
            border: dataMode === "live" ? "1px solid rgba(0,255,136,0.25)" : "1px solid rgba(180,77,255,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: "1.4rem" }}>{dataMode === "live" ? "🌐" : "🎮"}</span>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700 }}>
                    {dataMode === "live" ? "Live Market Data" : "Simulation Mode"}
                  </div>
                  <span className={`badge ${dataMode === "live" ? "badge-green" : "badge-muted"}`}>
                    {dataMode === "live" ? "● LIVE" : "⬡ MOCK"}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {dataMode === "live"
                    ? "Fetching real NSE prices from Yahoo Finance. Works only during market hours (9:15 AM – 3:30 PM IST, weekdays)."
                    : "Using simulated prices that fluctuate realistically. Works 24/7 — perfect for testing outside market hours."}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Toggle val={dataMode === "live"} onToggle={toggleDataMode} size="lg" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                  {dataMode === "live" ? "Click → Simulation" : "Click → Live"}
                </span>
              </div>
            </div>

            {/* Quick switch buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className={`btn btn-sm ${dataMode === "mock" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setDataModeDirectly("mock")}
              >
                🎮 Simulation (24/7)
              </button>
              <button
                className={`btn btn-sm ${dataMode === "live" ? "btn-green" : "btn-outline"}`}
                onClick={() => setDataModeDirectly("live")}
              >
                🌐 Live NSE Data
              </button>
            </div>
          </div>

          {/* ── PROFILE ── */}
          <Section title="👤 Profile" subtitle="Update your personal information">
            {/* Avatar color picker */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 10 }}>Avatar Color</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, color: "#000",
                  boxShadow: `0 0 16px ${avatarColor}66`,
                }}>
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {AVATAR_COLORS.map((c) => (
                    <div
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                        border: avatarColor === c ? "2px solid white" : "2px solid transparent",
                        boxShadow: avatarColor === c ? `0 0 10px ${c}` : "none",
                        transition: "var(--transition)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
            </div>

            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 10, marginTop: 4 }}>
              Change Password <span style={{ opacity: 0.5 }}>(leave blank to keep current)</span>
            </div>
            <div className="grid-2" style={{ gap: 14, marginBottom: 8 }}>
              <div className="input-group">
                <label className="input-label">Current Password</label>
                <input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="input-group">
                <label className="input-label">New Password</label>
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            <div className="input-group" style={{ maxWidth: "50%", marginBottom: 16 }}>
              <label className="input-label">Confirm New Password</label>
              <input type="password" value={confPass} onChange={(e) => setConfPass(e.target.value)} placeholder="••••••••" />
            </div>

            {profileMsg && (
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.75rem", padding: "10px 14px",
                borderRadius: "var(--radius-md)", marginBottom: 14,
                background: profileMsg.startsWith("✓") ? "rgba(0,255,136,0.08)" : "rgba(255,51,102,0.08)",
                border: `1px solid ${profileMsg.startsWith("✓") ? "rgba(0,255,136,0.25)" : "rgba(255,51,102,0.25)"}`,
                color: profileMsg.startsWith("✓") ? "var(--accent-green)" : "var(--accent-red)",
              }}>{profileMsg}</div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={handleProfileSave} disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </Section>

          {/* ── BALANCE & FUNDS ── */}
          <Section title="💰 Virtual Funds" subtitle="Manage your paper trading balance">
            {/* Current balance display */}
            <div style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: "16px 20px", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 4 }}>CURRENT BALANCE</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-green)" }}>
                  ₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "right" }}>
                <div>Total Trades: {user?.trades || 0}</div>
                <div>Realized P&L: {(user?.pnl || 0) >= 0 ? "+" : ""}₹{Math.abs(user?.pnl || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            {/* Quick balance presets */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 8 }}>Quick Set Balance</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {QUICK_BALANCES.map((amt) => (
                  <button
                    key={amt}
                    className={`btn btn-sm ${balance === amt ? "btn-primary" : "btn-outline"}`}
                    onClick={() => handleSetBalance(amt)}
                  >
                    ₹{(amt / 100000).toFixed(0)}L
                  </button>
                ))}
              </div>
            </div>

            {/* Top up */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap" }}>
              <div className="input-group" style={{ flex: 1, minWidth: 180 }}>
                <label className="input-label">Add Funds (₹)</label>
                <input
                  type="number" value={topUpAmount} min={1000} step={10000}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                />
              </div>
              <button className="btn btn-green" onClick={handleTopUp}>＋ Add Funds</button>
            </div>

            {/* Set custom balance */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div className="input-group" style={{ flex: 1, minWidth: 180 }}>
                <label className="input-label">Set Exact Balance (₹)</label>
                <input
                  type="number" defaultValue={balance} min={0} step={10000}
                  onBlur={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Enter exact amount"
                  id="exact-balance-input"
                />
              </div>
              <button className="btn btn-primary" onClick={() => {
                const val = document.getElementById("exact-balance-input").value;
                handleSetBalance(val);
              }}>Set Balance</button>
            </div>
          </Section>

          {/* ── PREFERENCES ── */}
          <Section title="⚙ Preferences" subtitle="Customize your trading experience">
            {[
              { label: "Trade Notifications", desc: "Show popup alerts for executed orders", val: notifications, set: setNotifications },
              { label: "Sound Effects",       desc: "Play sounds for buy/sell confirmations", val: soundFX,       set: setSoundFX },
              { label: "Compact Mode",        desc: "Reduce spacing for more data density",  val: compactMode,   set: setCompactMode },
            ].map(({ label, desc, val, set }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-primary)", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>{desc}</div>
                </div>
                <Toggle val={val} onToggle={() => set(!val)} />
              </div>
            ))}
          </Section>

          {/* ── ACCOUNT INFO ── */}
          <Section title="📋 Account Info" subtitle="Your account details">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {[
                { label: "User ID",      value: user?._id?.slice(-8).toUpperCase() },
                { label: "Account Type", value: user?.role === "admin" ? "Administrator" : "Trader" },
                { label: "Status",       value: user?.status || "active" },
                { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                { label: "Total Trades", value: user?.trades || 0 },
                { label: "Realized P&L", value: `${(user?.pnl || 0) >= 0 ? "+" : ""}₹${Math.abs(user?.pnl || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── DANGER ZONE ── */}
          <Section title="⚠ Danger Zone" subtitle="Irreversible actions — use carefully" accent="var(--accent-red)">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Reset portfolio */}
              <div style={{ background: "rgba(255,51,102,0.05)", border: "1px solid rgba(255,51,102,0.15)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-primary)", marginBottom: 4 }}>↺ Reset Portfolio</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 12 }}>
                  Clears all open positions and trade history. Sets balance to chosen amount. Cannot be undone.
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div className="input-group" style={{ minWidth: 160 }}>
                    <label className="input-label">Starting Balance (₹)</label>
                    <input type="number" value={resetBalance} min={10000} step={100000} onChange={(e) => setResetBalance(e.target.value)} />
                  </div>
                  <button
                    className={`btn btn-sm ${confirmReset ? "btn-red" : "btn-outline"}`}
                    style={{ borderColor: "rgba(255,51,102,0.5)", color: confirmReset ? undefined : "var(--accent-red)" }}
                    onClick={handleResetPortfolio}
                  >
                    {confirmReset ? "⚠ Confirm Reset?" : "↺ Reset Portfolio"}
                  </button>
                  {confirmReset && (
                    <button className="btn btn-sm btn-outline" onClick={() => setConfirmReset(false)}>Cancel</button>
                  )}
                </div>
              </div>

              {/* Wipe everything */}
              <div style={{ background: "rgba(255,51,102,0.05)", border: "1px solid rgba(255,51,102,0.2)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--accent-red)", marginBottom: 4 }}>✕ Full Account Reset</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 12 }}>
                  Wipes all trades, positions, and resets balance to ₹10,00,000. Complete fresh start.
                </div>
                <button
                  className={`btn btn-sm ${confirmWipe ? "btn-red" : "btn-outline"}`}
                  style={!confirmWipe ? { borderColor: "rgba(255,51,102,0.5)", color: "var(--accent-red)" } : {}}
                  onClick={handleWipeAll}
                >
                  {confirmWipe ? "⚠ Yes, Wipe Everything!" : "✕ Full Account Reset"}
                </button>
                {confirmWipe && (
                  <button className="btn btn-sm btn-outline" style={{ marginLeft: 8 }} onClick={() => setConfirmWipe(false)}>Cancel</button>
                )}
              </div>
            </div>
          </Section>

        </div>
      </div>
    </AppLayout>
  );
}

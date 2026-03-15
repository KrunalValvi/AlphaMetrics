import AppLayout from "../../components/AppLayout";
import React, { useState } from "react";



export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platformName: "AlphaMetrics",
    defaultBalance: 1000000,
    maxLeverage: 5,
    marketOpen: "09:15",
    marketClose: "15:30",
    allowSignups: true,
    maintenanceMode: false,
    emailNotifications: true,
    autoApproveOrders: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const Toggle = ({ val, onToggle }) => (
    <div onClick={onToggle} style={{
      width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "var(--transition)",
      background: val ? "var(--accent-green)" : "var(--bg-elevated)",
      border: val ? "1px solid var(--accent-green)" : "1px solid var(--border)",
      position: "relative",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "white",
        position: "absolute", top: 2, transition: "var(--transition)",
        left: val ? 22 : 2,
      }} />
    </div>
  );

  return (
    <AppLayout title="Platform Settings">
        <div className="page-body" style={{ paddingTop: 24 }}>

          <div style={{ maxWidth: 720 }}>

            {/* General */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header" style={{ marginBottom: 20 }}>
                <div>
                  <div className="card-title">General Settings</div>
                  <div className="card-subtitle">Core platform configuration</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">Platform Name</label>
                    <input value={settings.platformName} onChange={e => setSettings(s => ({ ...s, platformName: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Default Virtual Balance (₹)</label>
                    <input type="number" value={settings.defaultBalance} onChange={e => setSettings(s => ({ ...s, defaultBalance: e.target.value }))} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">Market Open Time</label>
                    <input type="time" value={settings.marketOpen} onChange={e => setSettings(s => ({ ...s, marketOpen: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Market Close Time</label>
                    <input type="time" value={settings.marketClose} onChange={e => setSettings(s => ({ ...s, marketClose: e.target.value }))} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Maximum Leverage (x)</label>
                  <input type="number" value={settings.maxLeverage} min={1} max={20} onChange={e => setSettings(s => ({ ...s, maxLeverage: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header" style={{ marginBottom: 20 }}>
                <div>
                  <div className="card-title">Feature Flags</div>
                  <div className="card-subtitle">Enable or disable platform features</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { key: "allowSignups", label: "Allow New Signups", desc: "Users can create new accounts" },
                  { key: "maintenanceMode", label: "Maintenance Mode", desc: "Disables platform access for all users" },
                  { key: "emailNotifications", label: "Email Notifications", desc: "Send order confirmation emails" },
                  { key: "autoApproveOrders", label: "Auto-Approve Orders", desc: "Orders execute immediately without manual review" },
                ].map(({ key, label, desc }) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-primary)", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>{desc}</div>
                    </div>
                    <Toggle val={settings[key]} onToggle={() => toggle(key)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ marginBottom: 20, border: "1px solid rgba(255,51,102,0.2)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--accent-red), transparent)", borderRadius: "12px 12px 0 0" }} />
              <div className="card-header" style={{ marginBottom: 16 }}>
                <div>
                  <div className="card-title" style={{ color: "var(--accent-red)" }}>⚠ Danger Zone</div>
                  <div className="card-subtitle">Irreversible platform actions</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="btn btn-outline btn-sm" style={{ borderColor: "rgba(255,51,102,0.4)", color: "var(--accent-red)" }}>
                  ↺ Reset All User Balances
                </button>
                <button className="btn btn-outline btn-sm" style={{ borderColor: "rgba(255,51,102,0.4)", color: "var(--accent-red)" }}>
                  ✕ Clear All Trade History
                </button>
                <button className="btn btn-outline btn-sm" style={{ borderColor: "rgba(255,51,102,0.4)", color: "var(--accent-red)" }}>
                  ⊘ Suspend All Users
                </button>
              </div>
            </div>

            {/* Save */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-outline">Discard Changes</button>
              <button className={`btn ${saved ? "btn-green" : "btn-primary"}`} onClick={handleSave}>
                {saved ? "✓ Saved!" : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
  );
}
